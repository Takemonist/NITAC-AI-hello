// TrainingNode.jsx
import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Chart.jsの登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TrainingNode = ({ classes, onModelTrained }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [epochs, setEpochs] = useState(10);
  const [batchSize, setBatchSize] = useState(16);
  const [learningRate, setLearningRate] = useState(0.001);
  const [training, setTraining] = useState(false);

  // 損失を追跡する状態
  const [lossHistory, setLossHistory] = useState([]);
  const [accuracyHistory, setAccuracyHistory] = useState([]);

  const handleTrain = async () => {
    if (classes.length === 0 || classes.some(cls => cls.images.length === 0)) {
      alert('少なくとも1つのクラスに画像を追加してください。');
      return;
    }

    setTraining(true);
    setLossHistory([]);
    setAccuracyHistory([]);
    try {
      // MobileNet v2 をロード
      const mobilenetLoaded = await mobilenet.load({ version: 2, alpha: 0.5 });
      console.log('MobileNet loaded with version 2 and alpha 0.5');

      // トレーニングデータの準備
      const images = [];
      const labels = [];

      classes.forEach((cls, classIndex) => {
        if (cls && cls.images) {
          cls.images.forEach(imgSrc => {
            const img = new Image();
            img.src = imgSrc;
            img.crossOrigin = 'anonymous';
            images.push(img);
            labels.push(classIndex);
          });
        } else {
          console.warn(`Class at index ${classIndex} is missing images or is undefined.`);
        }
      });

      // 画像の読み込み待機
      await Promise.all(images.map(img => new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => {
          console.error(`Failed to load image: ${img.src}`);
          reject(new Error(`Failed to load image: ${img.src}`));
        };
      })));

      // 画像をテンソルに変換し、MobileNetで特徴抽出
      const imageTensors = images.map(img => tf.browser.fromPixels(img)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .div(tf.scalar(127.5))
        .sub(tf.scalar(1))
      );
      const preprocessedTensors = tf.stack(imageTensors); // 形状: [num_samples, 224, 224, 3]

      // 特徴抽出
      const embeddings = mobilenetLoaded.infer(preprocessedTensors, true); // 'true' を渡してデフォルトの埋め込みを取得

      // クラスラベルをOne-Hotエンコード
      const ys = tf.tensor1d(labels, 'int32');
      const oneHotYs = tf.oneHot(ys, classes.length);

      // 分類モデルの定義
      const model = tf.sequential();
      model.add(tf.layers.dense({
        inputShape: [embeddings.shape[1]],
        units: 64,
        activation: 'relu'
      }));
      model.add(tf.layers.dense({
        units: classes.length,
        activation: 'softmax'
      }));

      model.summary();

      // モデルのコンパイル
      model.compile({
        optimizer: tf.train.adam(learningRate),
        loss: (classes.length === 2) ? 'binaryCrossentropy' : 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      // モデルのトレーニング
      await model.fit(embeddings, oneHotYs, {
        epochs,
        batchSize,
        callbacks: {
          onEpochEnd: (epoch, log) => {
            setLossHistory(prev => [...prev, log.loss.toFixed(4)]);
            setAccuracyHistory(prev => [...prev, (log.acc * 100).toFixed(2)]);
            console.log(`Epoch ${epoch + 1}: Loss = ${log.loss}, Accuracy = ${log.acc}`);
          },
          onTrainEnd: () => {
            console.log('Training complete.');
            try {
              onModelTrained(model);
              console.log('onModelTrained successfully called.');
            } catch (error) {
              console.error('Error in onModelTrained:', error);
            }
            // テンソルの解放
            embeddings.dispose();
            oneHotYs.dispose();
            ys.dispose();
            preprocessedTensors.dispose();
            imageTensors.forEach(tensor => tensor.dispose());
            setTraining(false);
          },
          onError: (error) => {
            console.error('Training error:', error);
            alert(`トレーニング中にエラーが発生しました: ${error.message || error}`);
            setTraining(false);
          }
        },
      });

    } catch (error) {
      console.error('Training failed:', error);
      alert(`トレーニング中にエラーが発生しました: ${error.message || error}`);
      setTraining(false);
    }
  };

  const handleReset = () => {
    setEpochs(10);
    setBatchSize(16);
    setLearningRate(0.001);
    setLossHistory([]);
    setAccuracyHistory([]);
  };

  // グラフデータの設定
  const lossChartData = {
    labels: lossHistory.map((_, index) => `Epoch ${index + 1}`),
    datasets: [
      {
        label: 'Loss',
        data: lossHistory,
        fill: false,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        tension: 0.1
      }
    ]
  };

  const lossChartOptions = {
    responsive: true,
    maintainAspectRatio: false, // 縦横比を固定しない
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Loss の推移',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'エポック',
        },
      },
      y: {
        beginAtZero: false, // 最小値を適切に設定
        title: {
          display: true,
          text: 'Loss',
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 w-96">
      <h2 className="text-xl font-semibold mb-4">トレーニング</h2>
      <button
        onClick={handleTrain}
        disabled={training}
        className={`w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-150 ease-in-out mb-4 ${
          training ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {training ? 'トレーニング中...' : 'モデルをトレーニングする'}
      </button>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-sm text-gray-600 flex items-center justify-between w-full mb-4"
      >
        詳細
        <ChevronDown className={`w-4 h-4 transform ${showDetails ? 'rotate-180' : ''}`} />
      </button>
      {showDetails && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm">エポック:</label>
            <div className="flex items-center">
              <input
                type="number"
                value={epochs}
                onChange={(e) => setEpochs(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-16 text-right border rounded px-2 py-1"
                min="1"
              />
              <HelpCircle className="w-4 h-4 ml-2 text-gray-400" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm">バッチサイズ:</label>
            <div className="flex items-center">
              <input
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-16 text-right border rounded px-2 py-1"
                min="1"
              />
              <HelpCircle className="w-4 h-4 ml-2 text-gray-400" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm">学習率:</label>
            <div className="flex items-center">
              <input
                type="number"
                step="0.0001"
                value={learningRate}
                onChange={(e) => setLearningRate(Math.max(0.0001, parseFloat(e.target.value) || 0.0001))}
                className="w-20 text-right border rounded px-2 py-1"
                min="0.0001"
              />
              <HelpCircle className="w-4 h-4 ml-2 text-gray-400" />
            </div>
          </div>
          <button
            onClick={handleReset}
            className="w-full bg-gray-200 text-gray-600 py-2 rounded-md hover:bg-gray-300 transition duration-150 ease-in-out"
          >
            設定をリセットする
          </button>
        </div>
      )}
      {lossHistory.length > 0 && (
        <div className="mt-6 h-64"> {/* 高さを調整 */}
          <Line data={lossChartData} options={lossChartOptions} />
        </div>
      )}
    </div>
  );
};

export default TrainingNode;