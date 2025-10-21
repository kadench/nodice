# Farkle Web 🎲
**The classic high-stakes dice game, rebuilt for the browser with a twist of Chaos.**

[![Status: In Development](https://img.shields.io/badge/Status-In%20Development-blue)](https://github.com/your-username/farkle-web)
[![Target Release](https://img.shields.io/badge/Target%20Release-Dec%2013th%2C%202024-red)](https://github.com/your-username/farkle-web)
[![Tech Stack](https://img.shields.io/badge/Tech-HTML%20%7C%20CSS%20%7C%20JS-orange)](https://github.com/your-username/farkle-web)

---

## Project Overview

This project is a web-based version of the classic dice game **Farkle**. Our goal is to deliver a fun, polished, and highly customizable Farkle experience in the browser. The game features interactive dice, robust score banking, run/turn management, and dynamic scoring rules. The main distinguishing feature is the planned addition of **Chaos Modifiers** that radically change the gameplay.

---

## Features

- **Interactive Dice Rolling:** Six dice rolled with secure, pseudo-randomness.
- **Dice Selection:** Select dice showing 1, 5, or valid sets for scoring (e.g., three-of-a-kind).
- **Score Banking:** Bank points from selected dice to your current run score.
- **Run and Turn Management:** Core game logic for banking scores, ending turns, and losing a run (Farkle!).
- **Standard Scoring Rules:** Support for three-of-a-kind, single 1s and 5s, and more.
- **Dynamic UI:** Responsive buttons and score displays to guide the player.
- **Planned Polish:** Improved CSS styling, layout, and a tutorial overlay.

---

## 🤯 Chaos Modifiers (Planned)

The Chaos Modifiers are game-altering rules designed to shake up the standard Farkle experience and increase replayability. These features are prioritized as they represent the project's unique value proposition.

| Modifier | Effect on Gameplay | Status |
| **Variable Dice Pool** | On roll, the number of dice available is randomly set between 4 and 8 (instead of the standard 6). | To Do |
| **Double Points** | A randomly selected die (or a specific die value) has its score value doubled *if* it is successfully banked. | To Do |
| **Forced Bank** | At the beginning of the turn, the player is forced to select and bank a single '1' or '5' *if available*, disrupting plans for larger sets. | To Do |
| **Mirror Image** | When a player banks a set of three dice, the next die rolled will automatically show the same value as the **lowest** banked die in that set (for the first roll only). | To Do |
| **Custom Scoring** | Planned option to allow players to change the point requirements or values of 1s, 5s, and sets before the game starts. | To Do |

---

## 🚀 Getting Started

To view or run this project locally, follow these simple steps.

### 🛠️ Technologies Used

This project is built using foundational web technologies:

- **Frontend:** **HTML5**, **CSS3**, **JavaScript** (Vanilla)
- **Styling:** Custom CSS for component styling and layout.
- **Deployment:** [Specify your deployment method, e.g., GitHub Pages]

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/farkle-web.git](https://github.com/your-username/farkle-web.git)
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd farkle-web
    ```
3.  **Open the game:**
    * Simply open `index.html` in your web browser to start playing immediately.

---

## How to Play

1.  **Roll Dice:** Click **"Roll All Dice"** to roll the available dice.
2.  **Select Dice:** Click dice showing 1, 5, or valid sets (like three-of-a-kind) to move them to the banked area and add their value to your score.
3.  **Bank Score:** Click **"Bank Score"** to add your current banked points to your run score and remove those dice from play.
4.  **Continue Rolling:** Keep rolling and banking until you lose your run or choose to end your turn.
5.  **End Turn:** Click **"End Turn"** to add your total run score to your overall score and start a new run with all six dice.
6.  **Lose Run (Farkle):** If you roll and **no** dice can be selected, your entire run score resets to zero, and your turn ends.

---

## Timeline & Milestones

This timeline is structured around team deliverables to ensure development stays on track.

| Dates | Goals & Deliverables |
| :--- | :--- |
| Oct 9–18 | Project setup, basic dice rolling/selection, and **Sprint 2 Final Report** submission. |
| Oct 19–25 | Implement core scoring rules, run/turn management, and prepare for **Freeze 1: Team Demo**. |
| Oct 26–Nov 1 | Conduct **Freeze 1: Demo Reflection** and begin initial implementation of **Chaos Modifiers**. |
| Nov 2–15 | Focused implementation of all **Chaos Modifiers** and **Custom Scoring**. Includes **Sprint 3: Team Initial Planning** and **Team Final Report**. |
| Nov 16–29 | UI/CSS Polish, accessibility improvements, adding help overlay. Includes **Sprint 4: Team Initial Planning** and **Module 5 Report**. |
| Nov 30–Dec 6 | Final bug fixing, rule tweaks, extensive playtesting, and preparation for **Freeze 2: Team Demo**. |
| Dec 7–17 | Final submission package, documentation, **Week-13: Final Report**, and **Conclusion: Final Reflection**. |

---

## 🗺️ Roadmap / Future Enhancements

These items are currently planned for implementation:

-   Refine dice selection logic and handle all edge cases (e.g., scoring a full house, four-of-a-kind, etc.).
-   Polish the site with professional **CSS styling** for an immersive look.
-   Add an instructions/help overlay for new players.
-   Conduct thorough playtesting and fix any remaining bugs.

---


## License

This project is [Specify License, e.g., MIT License, or keep the existing note: 'for educational purposes only'].