(function initCrackers() {
  if (!window.lottie) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  document.querySelectorAll("[data-cracker]").forEach((mount, index) => {
    const anim = lottie.loadAnimation({
      container: mount,
      renderer: "svg",
      loop: true,
      autoplay: false,
      path: "assets/crackers.json",
    });
    anim.addEventListener("DOMLoaded", () => {
      window.setTimeout(() => anim.play(), index * 700);
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
