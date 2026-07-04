const revealItems = document.querySelectorAll(".reveal");
const profileCards = document.querySelectorAll("[data-profile]");
const profilesSection = document.querySelector("#profiles");
const profilesTitle = document.querySelector("#profiles-title");

let profilesTitleLetters = [];

if (profilesTitle) {
  const titleText = profilesTitle.textContent || "";
  profilesTitle.classList.add("animated-title");
  profilesTitle.setAttribute("aria-label", titleText.trim());
  profilesTitle.textContent = "";

  profilesTitleLetters = Array.from(titleText).map((letter, index) => {
    const span = document.createElement("span");
    span.className = `title-letter${letter === " " ? " is-space" : ""}`;
    span.setAttribute("aria-hidden", "true");
    span.textContent = letter === " " ? "\u00a0" : letter;
    span.dataset.index = String(index);
    profilesTitle.append(span);
    return span;
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.2 }
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 80, 260)}ms`;
  revealObserver.observe(item);
});

profileCards.forEach((card) => {
  const button = card.querySelector(".cloud-face");

  button.addEventListener("click", () => {
    const isOpen = card.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(isOpen));

    profileCards.forEach((otherCard) => {
      if (otherCard !== card) {
        otherCard.classList.remove("is-open");
        otherCard.querySelector(".cloud-face").setAttribute("aria-expanded", "false");
      }
    });
  });
});

document.querySelectorAll('a[href="#profiles"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    if (!profilesSection) return;

    event.preventDefault();

    const sectionTop = window.scrollY + profilesSection.getBoundingClientRect().top;
    const viewHeight = window.innerHeight || document.documentElement.clientHeight;
    const pinDistance = Math.max(profilesSection.offsetHeight - viewHeight, 1);
    const centeredCloudProgress = 0.45;

    window.scrollTo({
      top: sectionTop + pinDistance * centeredCloudProgress - viewHeight * 0.1,
      behavior: "smooth",
    });
  });
});

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0, edge1, value) {
  const x = clamp((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function getNumber(card, name, fallback) {
  const value = Number.parseFloat(card.dataset[name]);
  return Number.isFinite(value) ? value : fallback;
}

function updateCloudTravel() {
  if (!profilesSection) return;

  const rect = profilesSection.getBoundingClientRect();
  const viewHeight = window.innerHeight || document.documentElement.clientHeight;
  const pinDistance = Math.max(rect.height - viewHeight, 1);
  const isPinned = rect.top <= 0 && rect.bottom >= viewHeight;
  const isAfter = rect.bottom < viewHeight;
  const progress = clamp((viewHeight * 0.1 - rect.top) / pinDistance);
  const titleProgressBase = clamp((viewHeight * 0.42 - rect.top) / pinDistance);
  const approach = smoothstep(0.08, 0.38, progress);
  const drift = smoothstep(0.74, 0.98, progress);
  const visible = smoothstep(0.04, 0.16, progress) * (1 - smoothstep(0.98, 1, progress));
  const isCompact = window.innerWidth < 700;

  profilesSection.classList.toggle("is-pinned", isPinned);
  profilesSection.classList.toggle("is-after", isAfter);

  profileCards.forEach((card, index) => {
    const startX = isCompact
      ? [-440, 440, -440][index]
      : getNumber(card, "startX", index % 2 ? 760 : -760);
    const startY = isCompact
      ? [0, 64, 124][index]
      : getNumber(card, "startY", 200);
    const targetX = isCompact
      ? 0
      : getNumber(card, "targetX", 0);
    const targetY = isCompact
      ? [-74, 64, 190][index]
      : getNumber(card, "targetY", 0);
    const driftX = isCompact
      ? [-360, 0, 360][index]
      : getNumber(card, "driftX", 220);
    const driftY = isCompact
      ? [34, 92, 46][index]
      : getNumber(card, "driftY", -120);

    const x = lerp(startX, targetX, approach) + driftX * drift;
    const y = lerp(startY, targetY, approach) + driftY * drift;
    const scale = lerp(0.78, 1, approach) - drift * 0.08;
    const rot = lerp(index % 2 ? 10 : -10, index === 1 ? 2 : -2, approach) + drift * (index - 1) * 8;

    card.style.setProperty("--cloud-x", `${x}px`);
    card.style.setProperty("--cloud-y", `${y}px`);
    card.style.setProperty("--cloud-scale", scale.toFixed(3));
    card.style.setProperty("--cloud-opacity", visible.toFixed(3));
    card.style.setProperty("--cloud-rot", `${rot.toFixed(2)}deg`);
  });

  if (profilesTitleLetters.length > 0) {
    const center = (profilesTitleLetters.length - 1) / 2;

    profilesTitleLetters.forEach((letter, index) => {
      const distanceFromCenter = center === 0 ? 0 : Math.abs(index - center) / center;
      const edgeFirstDelay = (1 - distanceFromCenter) * 0.1;
      const letterProgress = smoothstep(0.0 + edgeFirstDelay, 0.24 + edgeFirstDelay, titleProgressBase);
      const side = index < center ? -1 : 1;
      const startX = side * lerp(42, 130, distanceFromCenter);
      const startY = lerp(18, -28, distanceFromCenter) + (index % 3 - 1) * 6;
      const startRot = side * lerp(5, 11, distanceFromCenter);

      letter.style.setProperty("--letter-x", `${lerp(startX, 0, letterProgress).toFixed(2)}px`);
      letter.style.setProperty("--letter-y", `${lerp(startY, 0, letterProgress).toFixed(2)}px`);
      letter.style.setProperty("--letter-rot", `${lerp(startRot, 0, letterProgress).toFixed(2)}deg`);
      letter.style.setProperty("--letter-opacity", letterProgress.toFixed(3));
    });
  }
}

updateCloudTravel();
window.addEventListener("scroll", updateCloudTravel, { passive: true });
window.addEventListener("resize", updateCloudTravel);
