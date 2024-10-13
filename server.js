Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      return new Response(Bun.file("./dist/index.html")); // ビルド後のindex.htmlへのパス
    } else if (url.pathname.startsWith("/assets/")) {
      return new Response(Bun.file("./dist" + url.pathname)); // ビルド後のアセットへのパス
    } else {
      return new Response("404 Not Found", { status: 404 });
    }
  },
  https: {
    cert: './cert.pem',
    key: './key.pem',
  },
});