import { theBoiler } from "./boilerplate";
import { findParentOfClass, getOptionalStyle, hasClass, toggleClass } from "./classUtil";
import { getSafariDetails, RatingDetails } from "./events";
import { sendFeedback, sendRating } from "./eventSync";
import { getLogin } from "./storage";


/**
 * Create the Rating UI that lives above the top of the page (screen only).
 * @param fun If true, add the "fun" scale.
 * @param difficulty If true, add the "difficulty" scale.
 * @param feedback If true, add a button to provide verbatim feedback.
 */
export function createRatingUI(details:RatingDetails, margins:HTMLDivElement) {
  const show = shouldShowRatings();

  const div = document.createElement('div');
  div.id = "__puzzle_rating_ui";
  if (!show) {
    div.style.display = 'None';
  }

  div.appendChild(createRatingLabel("Rate this puzzle!"));

  if (details.fun) {
    div.appendChild(createRatingScale('Fun:', 'fun', 'star', 5));
  }

  if (details.difficulty) {
    div.appendChild(createRatingScale('Difficulty:', 'difficulty', 'diff', 5));
  }

  if (details.feedback) {
    div.appendChild(createFeedbackButton());
  }

  const body = document.getElementsByTagName('body')[0];
  body.appendChild(div);
}

export function showRatingUI(show: boolean) {
  const div = document.getElementById("__puzzle_rating_ui");
  if (div) {
    var isShowing = div.style.display != 'None';
    if (show != isShowing) {
      div.style.display = show ? '' : 'None';
    }
  }
}

function createRatingLabel(text:string):HTMLSpanElement {
  const span = document.createElement('span');
  toggleClass(span, 'rating-label', true);
  span.textContent = text;
  return span;
}

function createRatingScale(label:string, scale:string, img:string, max:number):HTMLSpanElement {
  const span = document.createElement('span');
  toggleClass(span, 'rating-group', true);
  span.appendChild(createRatingLabel(label));

  for (let i = 1; i <= max; i++) {
    const star = document.createElement('img');
    star.src = '../Images/Stars/' + img + '-' + i + '.png';
    star.title = `${scale}: ${i} out of ${max}`;
    toggleClass(star, 'rating-star', true);
    star.setAttribute('data-rating-scale', scale);
    star.setAttribute('data-rating-value', i.toString());
    star.onclick = () => { setRating(star); }
    span.appendChild(star);
  }
  return span;
}

function createFeedbackButton():HTMLSpanElement {
    const span = document.createElement('span');
    toggleClass(span, 'rating-label', true);
    const button = document.createElement('button');
    button.textContent = "Give Feedback";
    toggleClass(button, 'rating-feedback-button', true);
    button.onclick = () => { provideFeedback(button); }
    span.appendChild(button);
    return span;
}


/**
 * Callback when the user clicks one of the rating stars.
 * @param img Which image - could be from either group.
 */
async function setRating(img: HTMLElement) {
  const group = findParentOfClass(img, "rating-group");
  const others = group!.getElementsByClassName('rating-star');
  let unset = hasClass(img, 'selected');
  let changed = false;
  for (let i = others.length - 1; i >= 0; i--) {
    if (hasClass(others[i], 'selected')) {
      changed = true;
    }
    toggleClass(others[i], 'selected', false);
  }

  const scale = getOptionalStyle(img, 'data-rating-scale');
  let val = parseInt(getOptionalStyle(img, 'data-rating-value') || "0");

  if (!unset) {
    toggleClass(img, 'selected', true);
    if (scale) {
      await sendRating(scale, val);
    }
  }
  else {
    val = 0;
  }

}

/**
 * Solicit verbatim feedback, and pass it along to the server.
 * @param button The button the user clicked.
 */
async function provideFeedback(button:HTMLButtonElement) {
  const feedback = prompt("Feedback will be forwarded to this puzzle's authors.")
  if (feedback) {
    await sendFeedback(feedback);

    // Show UI on the feedback button that the message was received.
    toggleClass(button, 'sent', !!feedback);
  }
}

/**
 * Only show ratings for puzzles that care, and when we have a means to sync the feedback.
 * Meta materials, challenge tickets, and the home index don't care. They also, coincidentally, don't have authors.
 */
function shouldShowRatings(): boolean {
  const boiler = theBoiler();
  if (!boiler) {
    return false;
  }
  if (!boiler.author) {
    return false;  // Pages without authors are generally not interesting for ratings
  }

  // Event must be legit, and syncable
  const safari = getSafariDetails();
  if (!safari) {
    return false;
  }
  if (!safari.eventSync) {
    return false;
  }

  // Player must have logged in
  // (two reasons: to nail down the event, and because server doesn't have anonymous players)
  // const login = getLogin(safari.eventSync);
  // return !!login;

  return true;
}