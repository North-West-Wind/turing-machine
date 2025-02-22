# Frontend
The frontend uses Vite + React + Typescript.

To start off, you need Node.js installed. Launch a terminal and navigate to this directory, then run the following:
```bash
cd turing-machine-web
npm i # install all required packages
```
To get a website preview run:
```bash
npm run dev # starts a preview server at http://localhost:5173 (may vary)
```
To build bundled JS files, run:
```bash
npm run build # outputs to `dist/`
```

All built files should be static, which can be easily served from the server side.

## Future Plans
Due to unfamiliarity in the Preact framework from groupmate and lack of resources on the Internet about it, decision has been made to use React instead of Preact for now.
After most of the frontend development is done, I (NW) will migrate it back to Preact to optimize the frontend.