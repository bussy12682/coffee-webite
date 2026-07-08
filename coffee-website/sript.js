const navLinks = document.querySelectorAll(".nav-menu .nav-link");
const menuOpenButton = document.querySelector("#menu-open-button");
const menuCloseButton = document.querySelector("#menu-close-button");
const menuImageButtons = document.querySelectorAll(".menu-image-button");
const menuModalOverlay = document.querySelector("#menu-modal-overlay");
const menuModalCloseButton = document.querySelector("#menu-modal-close");
const menuModalImage = document.querySelector("#menu-modal-image");
const menuModalTitle = document.querySelector("#menu-modal-title");
const menuModalDescription = document.querySelector("#menu-modal-description");
const menuModalVariants = document.querySelector("#menu-modal-variants");
const revealItems = document.querySelectorAll(".reveal");
const orderForm = document.querySelector("#order-form");
const placeOrderButton = orderForm ? orderForm.querySelector('button[type="submit"]') : null;
const payNowButton = document.querySelector("#pay-now-button");
const paymentReferenceInput = document.querySelector("#payment-reference");
const confirmationModal = document.querySelector("#confirmation-modal");
const confirmationMessage = document.querySelector("#confirmation-message");
const closeConfirmationButton = document.querySelector("#close-confirmation");
const orderStatus = document.querySelector("#order-status");
let cardPaymentConfirmed = false;
const PAYSTACK_PUBLIC_KEY = "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const amountMultiplier = 100;

function isPaystackKeyValid() {
    return PAYSTACK_PUBLIC_KEY && !PAYSTACK_PUBLIC_KEY.includes("xxxxxxxx") && PAYSTACK_PUBLIC_KEY.startsWith("pk_");
}

function updatePaymentButtons() {
    const selectedPayment = document.querySelector('input[name="payment"]:checked')?.value;

    if (selectedPayment === "card") {
        cardPaymentConfirmed = false;
        if (placeOrderButton) placeOrderButton.disabled = true;
        if (payNowButton) payNowButton.disabled = false;
        if (paymentReferenceInput) paymentReferenceInput.value = "";
        if (orderStatus) orderStatus.textContent = "Please confirm your card payment before placing the order.";
    } else {
        if (placeOrderButton) placeOrderButton.disabled = false;
        if (payNowButton) payNowButton.disabled = true;
        if (paymentReferenceInput) paymentReferenceInput.value = "";
        if (orderStatus) orderStatus.textContent = "Cash on delivery selected. You can place the order immediately.";
    }
}

const paymentOptions = document.querySelectorAll('input[name="payment"]');
paymentOptions.forEach(option => option.addEventListener('change', updatePaymentButtons));

updatePaymentButtons();

if (menuOpenButton) {
    menuOpenButton.addEventListener("click", () => {
        document.body.classList.toggle("show-mobile-menu");
    });
}

function payWithPaystack(formData) {
    if (!window.PaystackPop) {
        if (orderStatus) orderStatus.textContent = "Paystack is not loaded. Please refresh the page.";
        return;
    }

    if (!isPaystackKeyValid()) {
        if (orderStatus) orderStatus.textContent = "Invalid Paystack public key. Please configure a valid key in the script.";
        alert("Please update the Paystack public key in sript.js before testing card payments.");
        return;
    }

    const amount = Number(formData.get("quantity")) || 1;
    const email = formData.get("email");
    const coffeeType = formData.get("coffeeType");
    const size = formData.get("size");
    const reference = `coffee-${Date.now()}`;

    const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email,
        amount: amount * amountMultiplier,
        currency: "NGN",
        ref: reference,
        metadata: {
            custom_fields: [
                { display_name: "Coffee", variable_name: "coffeeType", value: coffeeType },
                { display_name: "Size", variable_name: "size", value: size }
            ]
        },
        callback: function(response) {
            cardPaymentConfirmed = true;
            if (paymentReferenceInput) paymentReferenceInput.value = response.reference;
            if (placeOrderButton) placeOrderButton.disabled = false;
            if (orderStatus) orderStatus.textContent = "Payment confirmed. You may place your order now.";
            showConfirmation("Payment confirmed. Click Place Order to complete your order.");
        },
        onClose: function() {
            if (orderStatus) orderStatus.textContent = "Payment window closed. Please try again if you want to pay by card.";
        }
    });

    handler.openIframe();
}

if (menuCloseButton && menuOpenButton) {
    menuCloseButton.addEventListener("click", () => menuOpenButton.click());
}

navLinks.forEach(link => {
    link.addEventListener("click", () => {
        if (menuOpenButton) {
            menuOpenButton.click();
        }
    });
});

function closeMenuModal() {
    if (!menuModalOverlay) return;

    menuModalOverlay.classList.remove("active");
    menuModalOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

function openMenuModal(button) {
    if (!menuModalOverlay || !menuModalImage || !menuModalTitle || !menuModalDescription || !menuModalVariants) return;

    const variants = button.dataset.variants.split("|");
    const variantImages = (button.dataset.variantImages || "").split("|");

    menuModalImage.src = button.dataset.image;
    menuModalImage.alt = button.dataset.title;
    menuModalTitle.textContent = button.dataset.title;
    menuModalDescription.textContent = button.dataset.description;
    menuModalVariants.innerHTML = variants
        .map((variant, index) => {
            const [name, ingredients] = variant.split(":");
            const image = variantImages[index] || button.dataset.image;
            return `<li class="menu-variant-card"><img src="${image}" alt="${name.trim()}" class="variant-image"><div><strong>${name.trim()}</strong><span>${ingredients ? ingredients.trim() : "Freshly prepared"}</span></div></li>`;
        })
        .join("");

    menuModalOverlay.classList.add("active");
    menuModalOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

menuImageButtons.forEach(button => {
    button.addEventListener("click", () => openMenuModal(button));
});

if (menuModalCloseButton) {
    menuModalCloseButton.addEventListener("click", closeMenuModal);
}

if (menuModalOverlay) {
    menuModalOverlay.addEventListener("click", (event) => {
        if (event.target === menuModalOverlay) {
            closeMenuModal();
        }
    });
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuModalOverlay && menuModalOverlay.classList.contains("active")) {
        closeMenuModal();
    }
});

if (typeof Swiper !== "undefined" && document.querySelector('.slider-wrapper')) {
    const swiper = new Swiper('.slider-wrapper', {
      loop: true,
      grabCursor: true,
      spaceBetween: 25,
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
        dynamicBullets: true,
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      breakpoints: {
        0: {
            slidesPerView: 1
        },
        768: {
            slidesPerView: 2
        },
        1024: {
            slidesPerView: 3
        }
      }
    });
}

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

revealItems.forEach(item => revealObserver.observe(item));

function showConfirmation(message) {
    if (confirmationMessage) {
        confirmationMessage.textContent = message;
    }

    if (confirmationModal) {
        confirmationModal.classList.add("active");
        confirmationModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        confirmationModal.style.display = "flex";
        confirmationModal.scrollTop = 0;
    }
}

function hideConfirmation() {
    if (confirmationModal) {
        confirmationModal.classList.remove("active");
        confirmationModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }
}

if (closeConfirmationButton) {
    closeConfirmationButton.addEventListener("click", hideConfirmation);
}

if (confirmationModal) {
    confirmationModal.addEventListener("click", (event) => {
        if (event.target === confirmationModal) {
            hideConfirmation();
        }
    });
}

if (orderForm) {
    orderForm.addEventListener("submit", async (event) => {
        const selectedPayment = document.querySelector('input[name="payment"]:checked')?.value;
        if (selectedPayment === "card" && !cardPaymentConfirmed) {
            event.preventDefault();
            if (orderStatus) {
                orderStatus.textContent = "Please confirm your card payment before placing the order.";
            }
            return;
        }

        event.preventDefault();
        const formData = new FormData(orderForm);
        const coffeeType = formData.get("coffeeType");
        const size = formData.get("size");
        const quantity = formData.get("quantity");
        const location = formData.get("location");
        const email = formData.get("email");
        const note = formData.get("note");
        const payment = formData.get("payment");
        const paymentReference = formData.get("paymentReference") || "";

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            if (orderStatus) {
                orderStatus.textContent = "Please enter a valid email address.";
            }
            return;
        }

        if (orderStatus) {
            orderStatus.textContent = "Submitting your order...";
        }

        try {
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    coffeeType,
                    size,
                    quantity,
                    location,
                    email,
                    note,
                    payment,
                    paymentReference
                })
            });

            const data = await response.json();
            const message = data.message || "Your order was received.";

            if (orderStatus) {
                orderStatus.textContent = message;
            }

            showConfirmation(message);
            orderForm.reset();
            if (document.querySelector("#quantity")) {
                document.querySelector("#quantity").value = "1";
            }
            cardPaymentConfirmed = false;
            updatePaymentButtons();
        } catch (error) {
            if (orderStatus) {
                orderStatus.textContent = "There was a problem submitting your order. Please try again.";
            }
        }
    });
}

if (payNowButton) {
    payNowButton.addEventListener("click", () => {
        const selectedPayment = document.querySelector('input[name="payment"]:checked')?.value;
        const formData = new FormData(orderForm);
        const email = formData.get("email");

        if (selectedPayment !== "card") {
            if (orderStatus) {
                orderStatus.textContent = "Select card payment to use Pay Now.";
            }
            return;
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            if (orderStatus) {
                orderStatus.textContent = "Please enter a valid email before paying with card.";
            }
            return;
        }

        payWithPaystack(formData);
    });
}
