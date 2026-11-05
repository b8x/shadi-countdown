(function initCrackers() {
  if (!window.lottie) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  document.querySelectorAll("[data-cracker]").forEach((mount) => {
    lottie.loadAnimation({
      container: mount,
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: "assets/fireworks.json?v=6",
      rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
    });
  });
})();

(function initRouteMap() {
  const mount = document.getElementById("routeLottie");
  const stage = document.querySelector(".route-stage");
  if (!mount || !window.lottie) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const landmarks = [...document.querySelectorAll(".route-landmark")].map((el) => ({
    el,
    frame: Number(el.dataset.frame) || 0,
  }));

  const anim = lottie.loadAnimation({
    container: mount,
    renderer: "svg",
    loop: !reduce,
    autoplay: !reduce,
    path: "assets/pune-gwalior.json?v=2",
  });

  function syncLandmarks(frame) {
    landmarks.forEach(({ el, frame: at }) => {
      const near = Math.abs(frame - at) <= 5;
      const passed = frame >= at - 2;
      el.classList.toggle("is-near", near);
      el.classList.toggle("is-passed", passed && !near);
    });
  }

  if (reduce) {
    anim.addEventListener("DOMLoaded", () => {
      anim.goToAndStop(anim.totalFrames - 1, true);
      landmarks.forEach(({ el }) => {
        el.classList.add("is-passed");
        el.style.opacity = "0.85";
      });
    });
    return;
  }

  anim.addEventListener("enterFrame", () => syncLandmarks(anim.currentFrame));
  anim.addEventListener("DOMLoaded", () => syncLandmarks(0));
  if (stage) stage.classList.add("route-stage--live");
})();
