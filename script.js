const revealTargets = document.querySelectorAll(".hero-copy, .hero-visual, .service-card, .coverage-panel, .stat, .about-copy, .about-logo, .seo-card, .review-card, .faq-card, .request-copy, .request-form");

revealTargets.forEach((element) => {
  element.classList.add("reveal");
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -40px 0px",
  }
);

revealTargets.forEach((element) => observer.observe(element));

const form = document.querySelector("#service-request-form");
const status = document.querySelector("#form-status");

if (form && status) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    status.textContent = "";
    status.className = "form-status";

    if (!form.reportValidity()) {
      status.textContent = "Please fill out the required fields before sending.";
      status.classList.add("is-error");
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";

      const response = await fetch("/api/request-service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to send request.");
      }

      form.reset();
      status.textContent = "Request sent. Flyway Glass Co. should receive it by email shortly.";
      status.classList.add("is-success");
    } catch (error) {
      status.textContent = error.message || "Something went wrong while sending your request.";
      status.classList.add("is-error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Send Request";
    }
  });
}
