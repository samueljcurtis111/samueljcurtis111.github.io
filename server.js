import express from "express";
import WebSocket from "ws";

const app = express();

let latest = { waiting: true };

const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

ws.on("open", () => {
  ws.send(JSON.stringify({
    APIKey: process.env.AIS_KEY,
    BoundingBoxes: [[[-90, -180], [90, 180]]],
    FiltersShipMMSI: ["311001540"]
  }));
});

ws.on("message", (msg) => {
  const data = JSON.parse(msg.toString());
  const pr = data.Message?.PositionReport;

  if (pr) {
    latest = {
      lat: pr.Latitude,
      lon: pr.Longitude,
      speed: pr.Sog,
      heading: pr.TrueHeading
    };
  }
});

app.get("/ship", (req, res) => {
  res.json(latest);
});

app.listen(3000, () => console.log("Server running"));
