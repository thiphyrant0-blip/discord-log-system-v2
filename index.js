// ======================================================
// KEEP ALIVE WEB SERVER
// ======================================================

const http = require("http");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {

    res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8"
    });

    res.end(`
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bot Status</title>

<style>
* {
    box-sizing: border-box;
}

body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #0f172a;
    font-family: Arial, sans-serif;
}

.card {
    width: 90%;
    max-width: 420px;
    padding: 40px 25px;
    text-align: center;
    background: #111827;
    border-radius: 20px;
    box-shadow: 0 0 40px rgba(0,0,0,.4);
}

.status {
    font-size: 55px;
    margin-bottom: 15px;
}

h1 {
    color: white;
    margin: 0 0 10px;
}

.online {
    color: #57F287;
    font-size: 28px;
    font-weight: bold;
}

.text {
    color: #94a3b8;
    margin-top: 15px;
}
</style>
</head>

<body>

<div class="card">

    <div class="status">🟢</div>

    <h1>Discord Bot</h1>

    <div class="online">
        ONLINE
    </div>

    <div class="text">
        Meaow Log System V2
    </div>

</div>

</body>
</html>
`);
});

server.listen(PORT, () => {
    console.log(`🌐 Dashboard ONLINE: Port ${PORT}`);
});
