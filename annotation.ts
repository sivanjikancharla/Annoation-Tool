export default function CVATLikeAnnotationTool() {
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="bg-white shadow-2xl rounded-3xl p-6 mb-6 border">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Advanced CVAT-like Annotation Platform
              </h1>
              <p className="text-slate-600 text-lg">
                Image + video annotation with bounding boxes, polygons, zoom,
                task management, YOLO/COCO export, and smart annotation tools.
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-medium">
                Create Task
              </button>
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-medium">
                Save Project
              </button>
            </div>
          </div>
        </div>

        <AnnotationWorkspace />
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import {
  Upload,
  Download,
  Trash2,
  ZoomIn,
  ZoomOut,
  Square,
  Pentagon,
  Play,
  Pause,
  Layers,
  Save,
} from "lucide-react";

function AnnotationWorkspace() {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [mode, setMode] = useState("bbox");
  const [zoom, setZoom] = useState(1);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [taskName, setTaskName] = useState("Road Safety Dataset");
  const [boxes, setBoxes] = useState([]);
  const [polygons, setPolygons] = useState([]);
  const [currentPolygon, setCurrentPolygon] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentBox, setCurrentBox] = useState(null);
  const [label, setLabel] = useState("person");

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("video")) {
      const url = URL.createObjectURL(file);
      setVideo(url);
      setImage(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      setVideo(null);
      setBoxes([]);
      setPolygons([]);
    };
    reader.readAsDataURL(file);
  };

  const saveProject = () => {
    localStorage.setItem(
      "annotation-project",
      JSON.stringify({
        taskName,
        boxes,
        polygons,
      })
    );
  };

  useEffect(() => {
    const saved = localStorage.getItem("annotation-project");

    if (saved) {
      const parsed = JSON.parse(saved);
      setTaskName(parsed.taskName || "Dataset Task");
      setBoxes(parsed.boxes || []);
      setPolygons(parsed.polygons || []);
    }
  }, []);

  const exportYOLO = () => {
    const yolo = boxes
      .map(
        (b) =>
          `0 ${(b.x + b.width / 2).toFixed(4)} ${(b.y + b.height / 2).toFixed(4)} ${b.width.toFixed(4)} ${b.height.toFixed(4)}`
      )
      .join("\n");

    const blob = new Blob([yolo], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "annotations.txt";
    a.click();
  };

  const exportCOCO = () => {
    const coco = {
      annotations: boxes,
      polygons,
    };

    const blob = new Blob([JSON.stringify(coco, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "coco_annotations.json";
    a.click();
  };

  const addPolygonPoint = (e) => {
    const pos = getMousePos(e);
    setCurrentPolygon((prev) => [...prev, pos]);
  };

  const finishPolygon = () => {
    if (currentPolygon.length >= 3) {
      setPolygons((prev) => [
        ...prev,
        {
          points: currentPolygon,
          label,
        },
      ]);
    }

    setCurrentPolygon([]);
  };

  const toggleVideo = () => {
    const videoEl = document.getElementById("annotation-video");

    if (!videoEl) return;

    if (videoPlaying) {
      videoEl.pause();
    } else {
      videoEl.play();
    }

    setVideoPlaying(!videoPlaying);
  };

  const oldHandleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      setBoxes([]);
    };
    reader.readAsDataURL(file);
  };

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e) => {
    if (!image) return;

    const pos = getMousePos(e);
    setDrawing(true);
    setStartPoint(pos);
  };

  const handleMouseMove = (e) => {
    if (!drawing || !startPoint) return;

    const pos = getMousePos(e);

    setCurrentBox({
      x: Math.min(startPoint.x, pos.x),
      y: Math.min(startPoint.y, pos.y),
      width: Math.abs(pos.x - startPoint.x),
      height: Math.abs(pos.y - startPoint.y),
      label,
    });
  };

  const handleMouseUp = () => {
    if (currentBox) {
      setBoxes((prev) => [...prev, currentBox]);
    }

    setDrawing(false);
    setStartPoint(null);
    setCurrentBox(null);
  };

  const exportAnnotations = () => {
    const data = JSON.stringify(boxes, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "annotations.json";
    a.click();
  };

  const removeBox = (index) => {
    setBoxes((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-1 bg-white rounded-3xl shadow-xl p-5 space-y-5 border">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Project Controls</h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage tasks, labels, exports, and annotation modes.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Task Name</label>
          <input
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="w-full border rounded-2xl px-3 py-2"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl">
          <Upload size={18} />
          Upload Image
          <input type="file" accept="image/*" hidden onChange={handleUpload} />
        </label>

        <div>
          <label className="block text-sm font-medium mb-2">Object Label</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full border rounded-xl px-3 py-2"
            placeholder="Enter label"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode("bbox")}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-2xl ${
              mode === "bbox"
                ? "bg-indigo-600 text-white"
                : "bg-slate-200"
            }`}
          >
            <Square size={16} />
            BBox
          </button>

          <button
            onClick={() => setMode("polygon")}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-2xl ${
              mode === "polygon"
                ? "bg-indigo-600 text-white"
                : "bg-slate-200"
            }`}
          >
            <Pentagon size={16} />
            Polygon
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setZoom((z) => z + 0.1)}
            className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-2xl flex items-center justify-center gap-2"
          >
            <ZoomIn size={16} />
            Zoom In
          </button>

          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
            className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-2xl flex items-center justify-center gap-2"
          >
            <ZoomOut size={16} />
            Zoom Out
          </button>
        </div>

        <button
          onClick={saveProject}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-3 rounded-2xl"
        >
          <Save size={18} />
          Auto Save Project
        </button>

        <button
          onClick={exportAnnotations}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-2xl"
        >
          <Download size={18} />
          Export JSON
        </button>

        <button
          onClick={exportYOLO}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-2xl"
        >
          Export YOLO
        </button>

        <button
          onClick={exportCOCO}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-2xl"
        >
          Export COCO
        </button>

        <div>
          <h3 className="font-semibold mb-3">Annotations</h3>

          <div className="space-y-2 max-h-[400px] overflow-auto">
            {boxes.map((box, index) => (
              <div
                key={index}
                className="border rounded-xl p-3 flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">{box.label}</div>
                  <div className="text-xs text-gray-500">
                    {Math.round(box.x)}, {Math.round(box.y)}
                  </div>
                </div>

                <button
                  onClick={() => removeBox(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 bg-white rounded-3xl shadow-xl p-5 overflow-auto border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 px-4 py-2 rounded-2xl text-sm font-medium">
              Current Mode: {mode.toUpperCase()}
            </div>

            <div className="bg-slate-100 px-4 py-2 rounded-2xl text-sm font-medium">
              Zoom: {(zoom * 100).toFixed(0)}%
            </div>
          </div>

          {video && (
            <button
              onClick={toggleVideo}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-2xl flex items-center gap-2"
            >
              {videoPlaying ? <Pause size={16} /> : <Play size={16} />}
              {videoPlaying ? "Pause" : "Play"}
            </button>
          )}
        </div>

        <div
          className="relative inline-block border rounded-2xl overflow-hidden"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          {image || video ? (
            <>
              {image && (
                <img
                  ref={imageRef}
                  src={image}
                  alt="annotation"
                  className="max-w-full select-none"
                  draggable={false}
                />
              )}

              {video && (
                <video
                  id="annotation-video"
                  src={video}
                  className="max-w-full"
                />
              )}

              <svg
                ref={canvasRef}
                className="absolute inset-0 w-full h-full cursor-crosshair"
                onMouseDown={(e) => {
                  if (mode === "bbox") {
                    handleMouseDown(e);
                  } else {
                    addPolygonPoint(e);
                  }
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                {boxes.map((box, index) => (
                  <g key={index}>
                    <rect
                      x={box.x}
                      y={box.y}
                      width={box.width}
                      height={box.height}
                      fill="transparent"
                      stroke="#ff0000"
                      strokeWidth="2"
                    />

                    <text
                      x={box.x + 4}
                      y={box.y + 18}
                      fill="#ff0000"
                      fontSize="14"
                    >
                      {box.label}
                    </text>
                  </g>
                ))}

                {polygons.map((polygon, idx) => (
                  <polygon
                    key={idx}
                    points={polygon.points
                      .map((p) => `${p.x},${p.y}`)
                      .join(" ")}
                    fill="rgba(59,130,246,0.2)"
                    stroke="#2563eb"
                    strokeWidth="2"
                  />
                ))}

                {currentPolygon.length > 0 && (
                  <polyline
                    points={currentPolygon
                      .map((p) => `${p.x},${p.y}`)
                      .join(" ")}
                    fill="rgba(59,130,246,0.1)"
                    stroke="#2563eb"
                    strokeWidth="2"
                  />
                )}

                {mode === "polygon" && currentPolygon.length >= 3 && (
                  <foreignObject x="10" y="10" width="160" height="40">
                    <button
                      onClick={finishPolygon}
                      className="bg-blue-600 text-white px-3 py-2 rounded-xl text-sm"
                    >
                      Finish Polygon
                    </button>
                  </foreignObject>
                )}

                {currentBox && (
                  <g>
                    <rect
                      x={currentBox.x}
                      y={currentBox.y}
                      width={currentBox.width}
                      height={currentBox.height}
                      fill="transparent"
                      stroke="#00ff00"
                      strokeWidth="2"
                      strokeDasharray="4"
                    />
                  </g>
                )}
              </svg>
            </>
          ) : (
            <div className="w-[900px] h-[600px] flex items-center justify-center text-gray-400 text-lg">
              Upload an image to start annotating
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
