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
  if (!mount || !window.lottie) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const anim = lottie.loadAnimation({
    container: mount,
    renderer: "svg",
    loop: !reduce,
    autoplay: !reduce,
    path: "assets/pune-gwalior.json?v=2",
  });

  if (reduce) {
    anim.addEventListener("DOMLoaded", () => anim.goToAndStop(anim.totalFrames - 1, true));
  }
})();
