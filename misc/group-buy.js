export const widget = (() => {
  const API_URL = process.env.NUXT_ENV_GROUPBUY_URL || "http://localhost:3333";

  const translations = {
    en: {
      title: "Shop with friends and save",
      description:
        "Receive an extra discount when one of your friends purchases the same item.",
      discountedPrice: "For this purchase you will pay just:",
      linkText: "See how it works",
      buttonText: "Start a new group buy",
      joinButtonText: "Join existing group buy",
    },
    pl: {
      title: "Kupuj z przyjaciółmi i zaoszczędź",
      description:
        "Gdy przynajmniej jeden z twoich przyjaciół kupi te same produkty, otrzymacie dodatkowy rabat!",
      discountedPrice: "Za ten zakup zapłacisz tylko:",
      linkText: "Zobacz jak to działa",
      buttonText: "Rozpocznij zakup grupowy",
      joinButtonText: "Dołącz do istniejącego zakupu grupowego",
    },
    hu: {
      title: "Vásárolj barátaiddal és spórolj",
      description:
        "Extra kedvezményt kapsz, ha egy barátod ugyanazt a terméket vásárolja meg.",
      discountedPrice: "Ezért a vásárlásért csak ennyit kell fizetned:",
      linkText: "Nézd meg, hogyan működik",
      buttonText: "Csoportos vásárlás indítása",
      joinButtonText: "Csatlakozz a meglévő csoportos vásárláshoz",
    },
  };

  const getQueryParam = (param) =>
    new URLSearchParams(window.location.search).get(param);

  const removeQueryParam = (param) => {
    const url = new URL(window.location);
    url.searchParams.delete(param);
    window.history.replaceState({}, "", url.href);
  };

  const showAnimatedNotification = (
    message,
    type = "info",
    duration = 5000
  ) => {
    const notification = document.createElement("div");
    notification.innerText = message;

    const backgroundColor = type === "error" ? "#d9534f" : "#333333"; // red for error, dark for others

    notification.style = `
      display: block;
      position: fixed;
      top: 10px;
      right: 10px;
      background-color: ${backgroundColor};
      color: white;
      padding: 10px;
      border-radius: 5px;
      opacity: 0;
      transform: translateY(-20px);
      transition: opacity 0.3s ease, transform 0.3s ease;
      pointer-events: none;
      max-width: 80%;
      box-sizing: border-box;
      text-align: center;
    `;
    document.body.appendChild(notification);

    // Start the animation
    setTimeout(() => {
      notification.style.opacity = 1;
      notification.style.transform = "translateY(0)";
    }, 100);

    // Fade out and remove the notification after some time
    setTimeout(() => {
      notification.style.opacity = 0;
      notification.style.transform = "translateY(-20px)";
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300); // This should match the duration of the opacity and transform transitions
    }, duration);
  };

  const init = () => {
    const groupPurchaseId = getQueryParam("__groupPurchaseId");
    if (groupPurchaseId) {
      window.__groupPurchase = window.__groupPurchase || {};
      window.__groupPurchase.groupPurchaseId = groupPurchaseId;
      removeQueryParam("__groupPurchaseId");

      // Show animated notification
      showAnimatedNotification(
        'You have joined a group buy! Now select the required product and click "Join group buy" during checkout.'
      );
    }
  };

  const htmlForActive = (
    i18n,
    cssClasses,
    savingsAmount,
    discountedTotalPrice
  ) => ` <div class="${cssClasses.container}">
  <h3 class="${cssClasses.header}">${i18n.title} ${savingsAmount}!</h3>
  <p class="${cssClasses.paragraph}">
    ${i18n.description}
    <a href="#" class="${cssClasses.link}">${i18n.linkText}</a>
  </p>
  <p class="${cssClasses.savings}">
    ${i18n.discountedPrice} ${discountedTotalPrice}.
  </p>
  <button id="join-group-buy-button" class="${cssClasses.button}">${i18n.joinButtonText}</button>
  <p>or</p>
  <button id="start-group-buy-button" class="${cssClasses.button}">${i18n.buttonText}</button>
</div>`;

  const htmlForNew = (
    i18n,
    cssClasses,
    savingsAmount,
    discountedTotalPrice
  ) => ` <div class="${cssClasses.container}">
<h3 class="${cssClasses.header}">${i18n.title} ${savingsAmount}!</h3>
<p class="${cssClasses.paragraph}">
  ${i18n.description}
  <a href="#" class="${cssClasses.link}">${i18n.linkText}</a>
</p>
<p class="${cssClasses.savings}">
  ${i18n.discountedPrice} ${discountedTotalPrice}.
</p>
<button id="start-group-buy-button" class="${cssClasses.button}">${i18n.buttonText}</button>
</div>`;

  const makeApiCall = (payload) =>
    fetch(`${API_URL}/api/v1/group-purchase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }).then((response) => {
      if (response.ok) {
        return response.json().then((data) => {
          window.location.href = data.redirectUrl;
        });
      }

      // Handle HTTP errors
      return response.json().then((errorData) => {
        // You can customize this part based on how your API sends errors
        if (errorData.error === "target_basket_content_not_met") {
          return showAnimatedNotification(
            "Please make sure that you added all the required products for the group buy.",
            "error"
          );
        }

        if (errorData.error === "target_basket_value_not_met") {
          return showAnimatedNotification(
            "Please make sure that the total value of your basket meets the requirements for the group buy.",
            "error"
          );
        }

        return showAnimatedNotification(
          "Something went wrong. Please try again later or contact support.",
          "error"
        );
      });
    });

  const renderGroupBuy = ({
    discountedTotalPrice,
    savingsAmount,
    onStartGroupBuy,
    onJoinGroupBuy,
    lang = "en",
    cssClasses,
  }) => {
    const $el = document.querySelector("#group-buy");
    if (!$el) {
      console.warn("renderGroupBuy > no #group-buy element found");
      return;
    }

    if (!onStartGroupBuy) {
      console.warn("renderGroupBuy > onStartGroupBuy is required");
      return;
    }

    if (!discountedTotalPrice) {
      console.warn("renderGroupBuy > discountedTotalPrice is required");
      return;
    }

    if (!savingsAmount) {
      console.warn("renderGroupBuy > savingsAmount is required");
      return;
    }

    const classes = {
      container: "",
      header: "",
      paragraph: "",
      savings: "",
      link: "",
      button: "",
      ...cssClasses,
    };
    const i18n = translations[lang] || translations.en;
    const groupPurchaseId =
      window.__groupPurchase && window.__groupPurchase.groupPurchaseId;

    const contentToRender = groupPurchaseId
      ? htmlForActive(i18n, classes, savingsAmount, discountedTotalPrice)
      : htmlForNew(i18n, classes, savingsAmount, discountedTotalPrice);

    $el.innerHTML = contentToRender;

    const $startButton = $el.querySelector("#start-group-buy-button");
    $startButton.addEventListener("click", () => {
      onStartGroupBuy((products) => {
        makeApiCall({ products });
      });
    });

    const $joinButton = $el.querySelector("#join-group-buy-button");
    if ($joinButton) {
      $joinButton.addEventListener("click", () => {
        // add groupPurchaseId to payload in fetch
        onJoinGroupBuy((products) => {
          makeApiCall({ products, groupPurchaseId });
        });
      });
    }

    const refresh = (savingsAmount, discountedTotalPrice) => {
      const contentToRender = groupPurchaseId
        ? htmlForActive(i18n, classes, savingsAmount, discountedTotalPrice)
        : htmlForNew(i18n, classes, savingsAmount, discountedTotalPrice);

      $el.innerHTML = contentToRender;
    };

    return refresh;
  };

  return { init, renderGroupBuy };
})();
