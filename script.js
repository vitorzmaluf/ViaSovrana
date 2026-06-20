const header = document.querySelector(".site-header");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const links = document.querySelectorAll(".nav-links a[href^='#']");
const sections = document.querySelectorAll("main section[id]");

window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 12);
});

menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.classList.toggle("open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

links.forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const activeId = entry.target.getAttribute("id");
      links.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${activeId}`);
      });
    });
  },
  { rootMargin: "-35% 0px -58% 0px", threshold: 0 }
);

sections.forEach((section) => observer.observe(section));

const quoteForm = document.getElementById("quoteForm");
const formMessage = document.getElementById("formMessage");

quoteForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = Object.fromEntries(new FormData(quoteForm).entries());
  const phone = "5500000000000";

  const message = [
    "Olá, gostaria de solicitar uma cotação para transporte.",
    "",
    `Nome: ${data.nome || "-"}`,
    `Empresa: ${data.empresa || "-"}`,
    `WhatsApp: ${data.whatsapp || "-"}`,
    `E-mail: ${data.email || "-"}`,
    `Origem: ${data.origem || "-"}`,
    `Destino: ${data.destino || "-"}`,
    `Tipo de carga: ${data.carga || "-"}`,
    `Prazo desejado: ${data.prazo || "-"}`,
    `Peso aproximado: ${data.peso || "-"} kg`,
    `Observações: ${data.observacoes || "-"}`
  ].join("\n");

  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  formMessage.textContent = "Cotação montada. Abrindo WhatsApp para envio dos dados.";
  window.open(whatsappUrl, "_blank", "noopener");
});
