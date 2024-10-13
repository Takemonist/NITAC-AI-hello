// TeachableMachineUI.jsx
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import ClassNode from './class-node';
import TrainingNode from './training-node';
import PreviewNode from './preview-node';
import { v4 as uuidv4 } from 'uuid';

const TeachableMachineUI = () => {
  const [classes, setClasses] = useState([
    { id: uuidv4(), name: 'Class 1', images: [] },
    { id: uuidv4(), name: 'Class 2', images: [] },
    { id: uuidv4(), name: 'Class 3', images: [] },
  ]);
  const [trainedModel, setTrainedModel] = useState(null);
  const [epochs, setEpochs] = useState(50);
  const [batchSize, setBatchSize] = useState(16);
  const [learningRate, setLearningRate] = useState(0.001);

  // クラスを追加
  const addClass = () => {
    const newId = classes.length + 1;
    const newClass = {
      id: uuidv4(),
      name: `Class ${newId}`,
      images: [],
    };
    setClasses([...classes, newClass]);
  };

  // クラスを削除
  const deleteClass = (id) => {
    setClasses(classes.filter(cls => cls.id !== id));
  };

  // クラス名を変更
  const renameClass = (id, newName) => {
    setClasses(
      classes.map(cls => (cls.id === id ? { ...cls, name: newName } : cls))
    );
  };

  // エポック数の変更
  const handleEpochsChange = (e) => {
    const newEpochs = parseInt(e.target.value, 10);
    if (!isNaN(newEpochs)) {
      setEpochs(newEpochs);
    }
  };

  // バッチサイズの変更
  const handleBatchSizeChange = (e) => {
    const newBatchSize = parseInt(e.target.value, 10);
    if (!isNaN(newBatchSize)) {
      setBatchSize(newBatchSize);
    }
  };

  // 学習率の変更
  const handleLearningRateChange = (e) => {
    const newLearningRate = parseFloat(e.target.value);
    if (!isNaN(newLearningRate)) {
      setLearningRate(newLearningRate);
    }
  };

  // サンプルをアップロードから追加
  const handleAddSamplesFromUpload = (classId, files) => {
    const newImages = Array.from(files).map((file) =>
      URL.createObjectURL(file)
    );
    setClasses(
      classes.map((cls) =>
        cls.id === classId
          ? { ...cls, images: [...cls.images, ...newImages] }
          : cls
      )
    );
  };

  // サンプルをウェブカメラから追加
  const handleAddSamplesFromWebcam = (classId, dataUrl) => {
    setClasses((prevClasses) =>
      prevClasses.map((cls) =>
        cls.id === classId
          ? { ...cls, images: [...cls.images, dataUrl] }
          : cls
      )
    );
  };

  // サンプル画像を削除
  const handleRemoveSample = (classId, imageSrc) => {
    setClasses(
      classes.map((cls) =>
        cls.id === classId
          ? {
              ...cls,
              images: cls.images.filter((img) => img !== imageSrc),
            }
          : cls
      )
    );
  };

  // トレーニング後に受け取るモデル
  const handleTrainedModel = (model) => {
    console.log("model trained")
    setTrainedModel(model);
  };

  return (
    <div className="container mx-auto p-4 font-sans flex flex-col md:flex-row justify-start gap-4">
      {/* クラス管理セクション */}
      <div className="w-full md:w-1/3 space-y-4">
        {classes.map((cls) => (
          <ClassNode
            key={cls.id}
            cls={cls}
            onDelete={() => deleteClass(cls.id)}
            onRename={renameClass}
            onAddSamplesFromUpload={(files) =>
              handleAddSamplesFromUpload(cls.id, files)
            }
            onAddSamplesFromWebcam={(dataUrl) =>
              handleAddSamplesFromWebcam(cls.id, dataUrl)
            }
            onRemoveSample={handleRemoveSample}
          />
        ))}
        <button
          onClick={addClass}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:bg-gray-50 transition duration-150 ease-in-out flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          クラスを追加
        </button>
      </div>

      {/* トレーニングおよびプレビューセクション */}
      <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex justify-center items-center vcenter-sticky">
          <TrainingNode
            classes={classes}
            epochs={epochs}
            batchSize={batchSize}
            learningRate={learningRate}
            onModelTrained={handleTrainedModel}
            onReset={() => {
              setEpochs(50);
              setBatchSize(16);
              setLearningRate(0.001);
            }}
          />
        </div>
        <div className="flex-1 flex justify-center items-center vcenter-sticky">
          <PreviewNode
            model={trainedModel}
            classNames={classes.map((cls) => cls.name)}
          />
        </div>
      </div>
    </div>
  );
};

export default TeachableMachineUI;