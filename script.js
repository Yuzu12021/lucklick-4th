const menuButton = document.querySelector(".hamburger");
const fullscreenMenu = document.getElementById("fullscreenMenu");

if (menuButton && fullscreenMenu) {
  menuButton.addEventListener("click", () => {
    menuButton.classList.toggle("is-open");
    fullscreenMenu.classList.toggle("is-open");
  });

  fullscreenMenu.querySelectorAll("a:not(.disabled)").forEach((link) => {
    link.addEventListener("click", () => {
      menuButton.classList.remove("is-open");
      fullscreenMenu.classList.remove("is-open");
    });
  });
}

const heroSlides = document.querySelectorAll(".hero-photo-slider img");
let heroSlideIndex = 0;

if (heroSlides.length > 0) {
  setInterval(() => {
    heroSlides[heroSlideIndex].classList.remove("active");
    heroSlideIndex = (heroSlideIndex + 1) % heroSlides.length;
    heroSlides[heroSlideIndex].classList.add("active");
  }, 4200);
}

const fadeElements = document.querySelectorAll(".fade-up");

const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  {
    threshold: 0.18,
  }
);

fadeElements.forEach((element) => {
  fadeObserver.observe(element);
});

const photoInput = document.getElementById("photoInput");
const cropArea = document.getElementById("cropArea");
const cropImage = document.getElementById("cropImage");
const cropButton = document.getElementById("cropButton");
const croppedConfirm = document.getElementById("croppedConfirm");
const croppedPreview = document.getElementById("croppedPreview");
const entryForm = document.querySelector(".entry-form");

let cropper = null;
let croppedBlob = null;

if (
  photoInput &&
  cropArea &&
  cropImage &&
  cropButton &&
  croppedConfirm &&
  croppedPreview &&
  typeof Cropper !== "undefined"
) {
  photoInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    cropImage.src = imageUrl;
    cropArea.classList.add("is-active");

    croppedBlob = null;
    croppedConfirm.classList.remove("is-active");
    croppedPreview.src = "";
    cropButton.textContent = "この範囲で決定";
    cropButton.classList.remove("is-complete");

    if (cropper) {
      cropper.destroy();
    }

    cropper = new Cropper(cropImage, {
      aspectRatio: 3 / 2,
      viewMode: 1,
      dragMode: "move",
      autoCropArea: 1,
      responsive: true,
      background: false,
    });
  });

  cropButton.addEventListener("click", () => {
    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({
      width: 1800,
      height: 1200,
      imageSmoothingQuality: "high",
    });

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        croppedBlob = blob;

        const previewUrl = URL.createObjectURL(blob);
        croppedPreview.src = previewUrl;
        croppedConfirm.classList.add("is-active");

        cropButton.textContent = "トリミング完了！";
        cropButton.classList.add("is-complete");
      },
      "image/jpeg",
      0.9
    );
  });
}

if (entryForm) {
  entryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!croppedBlob) {
      alert("応募写真をトリミングしてから送信してください。");
      return;
    }

    const submitButton = entryForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "送信中...";

    try {
      const formData = new FormData(entryForm);

      formData.delete("photo");
      formData.append("photo", croppedBlob, "lucklick-photo-contest.jpg");

      const response = await fetch("http://localhost:3000/api/entry", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "送信に失敗しました");
      }

      console.log(result);

      const thanksCard = document.getElementById("thanksCard");

if (thanksCard) {
  thanksCard.classList.add("is-active");
  thanksCard.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
} else {
  alert("応募を受け付けました！");
}

      entryForm.reset();
      cropArea.classList.remove("is-active");
      croppedConfirm.classList.remove("is-active");
      croppedPreview.src = "";
      croppedBlob = null;

      if (cropper) {
        cropper.destroy();
        cropper = null;
      }

      cropButton.textContent = "この範囲で決定";
      cropButton.classList.remove("is-complete");
    } catch (error) {
      console.error(error);
      alert("送信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "応募する";
    }
  });
}