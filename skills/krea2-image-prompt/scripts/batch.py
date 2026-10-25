#!/usr/bin/env python
"""Run a list of Krea2 jobs sequentially via the shared graph builder."""
import json, os, sys, time, urllib.parse, urllib.request, uuid
from types import SimpleNamespace
from krea import BASE, build, get, post

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")


def run(job):
    a = SimpleNamespace(
        prompt=job["prompt"], negative=job.get("negative", ""),
        w=job.get("w", 1024), h=job.get("h", 1024), steps=job.get("steps", 8),
        cfg=job.get("cfg", 1.0), seed=job.get("seed", int(time.time() * 1000) % (2 ** 31)),
        sampler=job.get("sampler", "er_sde"), scheduler=job.get("scheduler", "simple"),
        unet=job.get("unet", "krea2_turbo_fp8_scaled.safetensors"),
        lora=job.get("lora"), prefix="krea/" + job["name"],
        latent=job.get("latent", "sd3"), init=job.get("init"),
        denoise=job.get("denoise", 1.0),
    )
    graph = build(a)
    try:
        r = post("/prompt", {"prompt": graph, "client_id": str(uuid.uuid4())})
    except urllib.error.HTTPError as e:
        print(f"[{job['name']}] ENQUEUE FAILED {e.code} {e.read().decode()[:1500]}")
        return
    pid = r["prompt_id"]
    t0 = time.time()
    while time.time() - t0 < 900:
        h = get(f"/history/{pid}")
        if pid in h:
            entry = h[pid]
            st = entry.get("status", {})
            if st.get("status_str") == "error":
                msgs = [m for m in st.get("messages", []) if m[0] in ("execution_error",)]
                print(f"[{job['name']}] ERROR {json.dumps(msgs, ensure_ascii=False)[:1200]}")
                return
            os.makedirs(OUT, exist_ok=True)
            for node in entry.get("outputs", {}).values():
                for im in node.get("images", []):
                    q = urllib.parse.urlencode({"filename": im["filename"],
                                                "subfolder": im.get("subfolder", ""),
                                                "type": im.get("type", "output")})
                    data = urllib.request.urlopen(f"{BASE}/view?{q}").read()
                    p = os.path.join(OUT, im["filename"])
                    open(p, "wb").write(data)
                    print(f"[{job['name']}] SAVED {p} ({time.time() - t0:.0f}s) seed={a.seed}")
            return
        time.sleep(1.0)
    print(f"[{job['name']}] TIMEOUT")


if __name__ == "__main__":
    jobs = json.load(open(sys.argv[1], encoding="utf-8"))
    for j in jobs:
        run(j)
