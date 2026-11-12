# Courses Played — how to run (for Dad)

This app lets you track New Zealand golf courses you’ve played, log rounds, add friends, and see what other golfers have played.

You need a computer with **internet** (login and saved data use the cloud).

This zip already includes the config files, so you should not need to create `.env` files yourself.

---

## 1. Install Node.js

1. Go to: https://nodejs.org/
2. Download the **LTS** version (recommended).
3. Run the installer — keep the default options (including “Add to PATH”).
4. Restart your computer if the installer asks you to.

Check it worked: open **PowerShell** or **Command Prompt** and type:

```text
node -v
npm -v
```

You should see version numbers (not an error).

---

## 2. Unzip the project

1. Unzip `CoursesPlayed-for-Dad.zip` somewhere easy, e.g. your Desktop.
2. You should see a folder with files like `package.json`, `README.md`, and this guide (`HOW-TO-RUN.md`).

---

## 3. Open a terminal in that folder

**Windows**

1. Open the unzipped folder in File Explorer.
2. Click the address bar, type `powershell`, press Enter.

Or: hold Shift, right‑click inside the folder → **Open in Terminal** / **Open PowerShell window here**.

---

## 4. Install and set up (one-time)

Run these commands **one at a time**:

```text
npm install
```

Wait until it finishes (can take a few minutes).

```text
npm run migrate
```

```text
npm run seed
```

That loads the New Zealand course list onto your computer.

---

## 5. Start the app

```text
npm run dev
```

Leave that window open. You should see something like:

- Server listening on port **3000**
- Local: **http://localhost:8080/**

---

## 6. Use it in your browser

Open: **http://localhost:8080/**

1. Click **Register** and create your own username / email / password.
2. Explore the **map**, mark courses as played, and log rounds from a course page.
3. **Add Ben as a friend** (important):
   - Open **Golfers** in the top menu
   - Search for **`benpai11`**
   - Open that profile and click **Add friend**
   - (Ben can accept the request from his profile)
4. Once you’re friends, you can see each other’s courses played and round details.

To stop the app later: go back to the terminal and press **Ctrl + C**.

---

## Next time you want to use it

1. Open a terminal in the same project folder.
2. Run: `npm run dev`
3. Open http://localhost:8080/

You only need `npm install` / `migrate` / `seed` the first time (or if something breaks).

---

## Shared data note

- The **course list / map** is stored on **your PC**.
- **Accounts, played courses, rounds, friends, and forum** live in **Firebase** (cloud).
- This package uses the same online project as Ben, so you can friend each other.

---

## Troubleshooting

| Problem | What to try |
| --- | --- |
| `node` / `npm` not recognised | Reinstall Node.js LTS and restart the PC |
| `npm install` fails | Make sure you’re online; try again |
| Port already in use | Close other `npm run dev` windows, or restart the PC |
| Page won’t load | Confirm the terminal still shows the server running, then try http://localhost:8080/ again |
| Blank map / no courses | Run `npm run migrate` then `npm run seed` again |
| Can’t register / sign in | Check you’re online |
| Can’t find `benpai11` | Make sure you’re signed in, then search exactly `benpai11` |
| “Missing or insufficient permissions” | Send Ben a screenshot |

---

## Need help?

If you’re stuck, send Ben a screenshot of the terminal error (the red text) and what step you were on.
