# Dollar ↔ Yuan — Currency Studio

A responsive USD/CNY currency conversion webpage, adapted from the original `Currency.py` program.

## Files

- `index.html` — structure and page content
- `styles.css` — colors, layout, animations and responsive design
- `app.js` — loads the daily exchange rate, converts amounts, swaps currencies, copies results
- `Currency.py` — the original Python command-line version, preserved for comparison
- `favicon.svg` — small browser icon
- `.nojekyll` — tells GitHub Pages to serve files without Jekyll processing

## Preview on your computer

Open `index.html` in a web browser. An internet connection is required to load the published currency rate. If browser security blocks API requests when opening a local file directly, use a simple local server from the project directory:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000.

## Publish on GitHub Pages

1. Create a new GitHub repository, for example `dollar-yuan-studio`.
2. Upload **the files inside this folder**, not the outer containing folder. `index.html` must be in the repository root.
3. Open **Settings → Pages** in your repository.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch **main** and folder **/(root)**, then click **Save**.
6. GitHub will show the published site address under **Settings → Pages**. The project site typically has the form `https://YOUR-USERNAME.github.io/dollar-yuan-studio/`.

## How it works

The JavaScript is a browser-native adaptation of the Python script:

```python
response = requests.get("https://api.frankfurter.dev/v2/rate/USD/CNY")
rate = response.json()["rate"]
yuan = dollars * rate
```

In JavaScript we instead use `fetch()` to get the rate, then multiply the amount by it. When swapping to CNY → USD, the webpage requests the corresponding reverse rate.

Rate source: [Frankfurter](https://frankfurter.dev/), with published daily reference rates. These are **not live intraday quotes** and may differ from banks, card networks or remittance services. It requires an internet connection and availability of the external API.

The site is fully static: no backend, build tool, library dependencies or API key needed.
