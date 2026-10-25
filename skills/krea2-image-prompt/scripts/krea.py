#!/usr/bin/env python
"""Minimal Krea2 txt2img/img2img runner against the local ComfyUI.

ComfyUI defaults to http://127.0.0.1:8188; override with COMFY_URL.

Usage:
  python krea.py --prompt "..." [--negative "..."] [--w 1024] [--h 1024]
                 [--steps 8] [--cfg 1] [--seed 1] [--sampler er_sde]
                 [--scheduler simple] [--unet <file>] [--lora name:strength]
                 [--prefix krea/prompt] [--latent sd3|plain] [--out DIR]
                 [--init image.png --denoise 0.45] [--no-wait]
"""
import argparse, json, os, time, urllib.parse, urllib.error, urllib.request, uuid

BASE = os.environ.get("COMFY_URL", "http://127.0.0.1:8188")


def post(path, payload):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    return json.load(urllib.request.urlopen(req))


def get(path):
    return json.load(urllib.request.urlopen(BASE + path))


def upload(path):
    """POST a local file to ComfyUI's input dir; returns the stored filename."""
    boundary = "----krea" + uuid.uuid4().hex
    name = os.path.basename(path)
    body = b"".join([
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"{name}\"\r\n"
        f"Content-Type: application/octet-stream\r\n\r\n".encode(),
        open(path, "rb").read(),
        f"\r\n--{boundary}\r\nContent-Disposition: form-data; name=\"overwrite\"\r\n\r\ntrue"
        f"\r\n--{boundary}--\r\n".encode(),
    ])
    req = urllib.request.Request(
        BASE + "/upload/image", data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    return json.load(urllib.request.urlopen(req))["name"]


def build(a):
    g = {
        "1": {"class_type": "UNETLoader",
              "inputs": {"unet_name": a.unet, "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader",
              "inputs": {"clip_name": "qwen3vl_4b_fp8_scaled.safetensors", "type": "krea2"}},
        "3": {"class_type": "VAELoader",
              "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["2", 0], "text": a.prompt}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["2", 0], "text": a.negative}},
        "6": {"class_type": "EmptySD3LatentImage" if a.latent == "sd3" else "EmptyLatentImage",
              "inputs": {"width": a.w, "height": a.h, "batch_size": 1}},
        "7": {"class_type": "KSampler",
              "inputs": {"model": ["1", 0], "positive": ["4", 0], "negative": ["5", 0],
                         "latent_image": ["6", 0], "seed": a.seed, "steps": a.steps,
                         "cfg": a.cfg, "sampler_name": a.sampler,
                         "scheduler": a.scheduler, "denoise": getattr(a, "denoise", 1.0)}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "SaveImage",
              "inputs": {"images": ["8", 0], "filename_prefix": a.prefix}},
    }
    model = ["1", 0]
    for i, spec in enumerate(a.lora or []):
        name, _, strength = spec.partition(":")
        nid = f"l{i}"
        g[nid] = {"class_type": "LoraLoader",
                  "inputs": {"model": model, "clip": ["2", 0], "lora_name": name,
                             "strength_model": float(strength or 1.0),
                             "strength_clip": float(strength or 1.0)}}
        model = [nid, 0]
        g["4"]["inputs"]["clip"] = [nid, 1]
        g["5"]["inputs"]["clip"] = [nid, 1]
    if a.lora:
        g["7"]["inputs"]["model"] = model
    init = getattr(a, "init", None)
    if init:
        stored = upload(init)
        g["i1"] = {"class_type": "LoadImage", "inputs": {"image": stored}}
        g["i2"] = {"class_type": "VAEEncode", "inputs": {"pixels": ["i1", 0], "vae": ["3", 0]}}
        g["7"]["inputs"]["latent_image"] = ["i2", 0]
        del g["6"]
    return g


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--prompt", required=True)
    p.add_argument("--negative", default="")
    p.add_argument("--w", type=int, default=1024)
    p.add_argument("--h", type=int, default=1024)
    p.add_argument("--steps", type=int, default=8)
    p.add_argument("--cfg", type=float, default=1.0)
    p.add_argument("--seed", type=int, default=-1)
    p.add_argument("--sampler", default="er_sde")
    p.add_argument("--scheduler", default="simple")
    p.add_argument("--unet", default="krea2_turbo_fp8_scaled.safetensors")
    p.add_argument("--lora", action="append")
    p.add_argument("--prefix", default="krea/test")
    p.add_argument("--latent", default="sd3", choices=["sd3", "plain"])
    p.add_argument("--init", help="local image to img2img from (uploads it)")
    p.add_argument("--denoise", type=float, default=1.0)
    p.add_argument("--out", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "out"))
    p.add_argument("--no-wait", action="store_true")
    a = p.parse_args()
    if a.seed < 0:
        a.seed = int(time.time() * 1000) % (2 ** 31)

    graph = build(a)
    cid = str(uuid.uuid4())
    try:
        r = post("/prompt", {"prompt": graph, "client_id": cid})
    except urllib.error.HTTPError as e:
        print("ENQUEUE FAILED", e.code, e.read().decode()[:4000])
        return
    pid = r["prompt_id"]
    print(f"prompt_id={pid} seed={a.seed}")
    if a.no_wait:
        return

    t0 = time.time()
    while time.time() - t0 < 900:
        h = get(f"/history/{pid}")
        if pid in h:
            entry = h[pid]
            st = entry.get("status", {})
            if st.get("status_str") == "error" or not st.get("completed", True):
                print("EXECUTION ERROR:", json.dumps(st, ensure_ascii=False)[:4000])
            imgs = []
            for node in entry.get("outputs", {}).values():
                imgs += node.get("images", [])
            os.makedirs(a.out, exist_ok=True)
            for im in imgs:
                q = urllib.parse.urlencode({"filename": im["filename"],
                                            "subfolder": im.get("subfolder", ""),
                                            "type": im.get("type", "output")})
                data = urllib.request.urlopen(f"{BASE}/view?{q}").read()
                path = os.path.join(a.out, im["filename"])
                with open(path, "wb") as f:
                    f.write(data)
                print("SAVED", path)
            print(f"elapsed={time.time() - t0:.1f}s")
            return
        time.sleep(1.5)
    print("TIMEOUT (job may still be running)")


if __name__ == "__main__":
    main()
