(function initRouteMap() {
  const openBtn = document.getElementById("routeOpen");
  const overlay = document.getElementById("routeOverlay");
  const closeBtn = document.getElementById("routeClose");
  const mount = document.getElementById("routeLottie");
  if (!openBtn || !overlay || !mount || !window.lottie) return;

  let anim = null;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ensure() {
    if (anim) return anim;
    anim = lottie.loadAnimation({
      container: mount,
      renderer: "svg",
      loop: !reduce,
      autoplay: !reduce,
      path: "assets/pune-gwalior.json",
    });
    if (reduce) anim.addEventListener("DOMLoaded", () => anim.goToAndStop(anim.totalFrames - 1, true));
    return anim;
  }

  function open() {
    overlay.classList.remove("hidden");
    const player = ensure();
    if (!reduce) player.goToAndPlay(0, true);
  }

  function close() {
    overlay.classList.add("hidden");
    if (anim && !reduce) anim.pause();
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.classList.contains("hidden")) close();
  });
})();
