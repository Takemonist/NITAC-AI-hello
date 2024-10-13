// ClassNode.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  Pencil,
  MoreVertical,
  Trash,
  Settings,
} from 'lucide-react';
import Webcam from 'react-webcam';

const ClassNode = ({
  cls,
  onDelete,
  onRename,
  onAddSamplesFromWebcam,
  onAddSamplesFromUpload,
  onRemoveSample, // 画像削除のためのprops
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(cls.name);
  const [capturing, setCapturing] = useState(false);
  const [fps, setFps] = useState(5);
  const [isRecording, setIsRecording] = useState(false);

  const webcamRef = useRef(null);
  const captureInterval = useRef(null);

  const handleRename = () => {
    if (newName.trim() !== '') {
      onRename(cls.id, newName);
      setIsEditing(false);
    }
  };

  const handleClickOutside = (event) => {
    if (showOptions && !event.target.closest('.options-menu')) {
      setShowOptions(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearInterval(captureInterval.current);
    };
  }, [showOptions]);

  const handleCapture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        onAddSamplesFromWebcam(imageSrc);
      }
    }
  }, [onAddSamplesFromWebcam]);

  const startCapturing = useCallback(() => {
    if (!isRecording) {
      setIsRecording(true);
      handleCapture(); // すぐに1枚キャプチャ
      captureInterval.current = setInterval(handleCapture, 1000 / fps);
    }
  }, [isRecording, handleCapture, fps]);

  const stopCapturing = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
      clearInterval(captureInterval.current);
    }
  }, [isRecording]);

  const handleRemoveSample = (imageSrc) => {
    onRemoveSample(cls.id, imageSrc);
  };

  const handleFPSChange = (e) => {
    const newFps = parseInt(e.target.value, 10);
    if (!isNaN(newFps) && newFps > 0 && newFps <= 30) {
      setFps(newFps);
    }
  };

  // FPSが変更されたときにインターバルをリセット
  useEffect(() => {
    if (isRecording) {
      clearInterval(captureInterval.current);
      captureInterval.current = setInterval(handleCapture, 1000 / fps);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fps]);

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          {isEditing ? (
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
                }
              }}
              onBlur={handleRename}
              className="border rounded px-2 py-1 mr-2"
              autoFocus
            />
          ) : (
            <h2 className="text-lg font-semibold">{cls.name}</h2>
          )}
          <Pencil
            className="w-4 h-4 ml-2 text-gray-400 cursor-pointer"
            onClick={() => setIsEditing(true)}
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {showOptions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 options-menu">
              <div className="py-1">
                <button
                  onClick={onDelete}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  クラスを削除
                </button>
                {/* 他のオプションを追加可能 */}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <p className="text-sm text-gray-600 mb-2">画像サンプルを追加する:</p>
      <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 mb-4">
        <button
          onClick={() => setCapturing(true)}
          className="flex items-center justify-center bg-blue-50 text-blue-600 px-4 py-2 rounded-md text-sm"
        >
          <Camera className="w-4 h-4 mr-2" />
          ウェブカメラ
        </button>
        <label className="flex items-center justify-center bg-blue-50 text-blue-600 px-4 py-2 rounded-md text-sm cursor-pointer">
          <Upload className="w-4 h-4 mr-2" />
          アップロード
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => onAddSamplesFromUpload(e.target.files)}
          />
        </label>
        {capturing && (
          <button
            onClick={() => setCapturing(false)}
            className="flex items-center justify-center bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm"
          >
            キャンセル
          </button>
        )}
      </div>

      {/* Webcam Capture Section */}
      {capturing && (
        <div className="mb-4">
          <div className="flex flex-col items-center space-y-4">
            {/* Webcam Feed */}
            <div className="w-full max-w-md">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full h-auto aspect-square object-cover rounded border"
                videoConstraints={{
                  width: 400,
                  height: 400,
                  facingMode: 'user',
                }}
                onUserMediaError={() => console.log('cant access your camera')}
              />
            </div>

            {/* Recording Controls */}
            <div className="flex items-center space-x-4">
              <button
                onMouseDown={startCapturing}
                onMouseUp={stopCapturing}
                onMouseLeave={stopCapturing}
                onTouchStart={startCapturing}
                onTouchEnd={stopCapturing}
                disabled={isRecording}
                className={`flex items-center justify-center ${
                  isRecording
                    ? 'bg-red-600 cursor-not-allowed opacity-75'
                    : 'bg-red-500 hover:bg-red-600 transition'
                } text-white px-6 py-3 rounded-md text-sm font-medium`}
              >
                {isRecording ? '録画中...' : '録画'}
              </button>
              <div className="flex items-center space-x-2">
                {/* FPS Input */}
                <label className="flex items-center text-sm text-gray-700">
                  FPS:
                  <input
                    type="number"
                    value={fps}
                    onChange={handleFPSChange}
                    min="1"
                    max="30"
                    className="ml-2 w-16 border rounded px-2 py-1"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Captured Images Section */}
      <div className="flex flex-wrap gap-2 overflow-y-auto max-h-40">
        {cls.images.map((img, index) => (
          <div key={index} className="relative group">
            <img
              src={img}
              alt={`${cls.name} ${index + 1}`}
              className="w-20 h-20 object-cover rounded border"
            />
            <button
              className="absolute top-1 left-1 p-1 bg-transparent rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200"
              onClick={() => handleRemoveSample(img)}
              aria-label="Delete Image"
            >
              <Trash className="w-5 h-5 text-white" strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassNode;