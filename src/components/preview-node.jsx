// PreviewNode.jsx
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { Camera, Upload } from 'lucide-react'; // Uploadアイコンを追加

const PreviewNode = ({ model, classNames }) => {
  const webcamRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [predictions, setPredictions] = useState([]); // 予測結果を配列で保持
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mobileNetModel, setMobileNetModel] = useState(null);

  // MobileNetのロード
  useEffect(() => {
    const loadMobileNet = async () => {
      try {
        const mobilenetLoaded = await mobilenet.load({ version: 2, alpha: 0.5 });
        setMobileNetModel(mobilenetLoaded);
        console.log('MobileNet loaded successfully for prediction.');
      } catch (err) {
        console.error('Error loading MobileNet:', err);
        setError('MobileNetのロード中にエラーが発生しました。');
      }
    };

    loadMobileNet();
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && model && mobileNetModel) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setError(null);
        setLoading(true);
        setPreviewImage(reader.result);
        performPrediction(reader.result);
      };
      reader.onerror = () => {
        setError('ファイルの読み込み中にエラーが発生しました。');
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } else if (!model) {
      setError('モデルがロードされていません。トレーニングを完了してください。');
    } else if (!mobileNetModel) {
      setError('MobileNetがロードされていません。少々お待ちください。');
    }
  };

  const captureAndPredict = async () => {
    if (webcamRef.current && model && mobileNetModel) {
      setError(null);
      setLoading(true);
      const imageSrc = webcamRef.current.getScreenshot();
      setPreviewImage(imageSrc);
      performPrediction(imageSrc);
    } else {
      if (!model) {
        setError('モデルがロードされていません。トレーニングを完了してください。');
      } else if (!mobileNetModel) {
        setError('MobileNetがロードされていません。少々お待ちください。');
      }
    }
  };

  const performPrediction = async (imageSrc) => {
    try {
      const img = new Image();
      img.src = imageSrc;
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        try {
          // 画像を MobileNet で処理して特徴量を抽出
          const activation = mobileNetModel.infer(img, true); // Trueで最終のGlobalAveragePooling層の出力を取得
          
          // 予測モデル（分類器）に特徴量を入力
          const predictionTensor = model.predict(activation);
          const predictionData = await predictionTensor.data();

          // 予測結果を整形
          const allPredictions = classNames.map((className, index) => ({
            className,
            probability: (predictionData[index] * 100).toFixed(2),
          }));

          setPredictions(allPredictions); // 全ての予測結果を状態に設定
          setLoading(false);

          // クリーンアップ
          activation.dispose();
          predictionTensor.dispose();
        } catch (err) {
          console.error('Prediction error:', err);
          setError('予測中にエラーが発生しました。');
          setLoading(false);
        }
      };

      img.onerror = () => {
        setError('画像の読み込み中にエラーが発生しました。');
        setLoading(false);
      };
    } catch (err) {
      console.error('Error during prediction setup:', err);
      setError('予測のセットアップ中にエラーが発生しました。');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">プレビュー</h2>
      <div className="flex flex-col items-center">
        <div className="mt-4 w-full flex flex-col items-center">
          <label className="flex items-center cursor-pointer bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
            <Upload className="w-5 h-5 mr-2" />
            <span>画像をアップロード</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {previewImage && (
          <div className="mt-4 w-full">
            <img src={previewImage} alt="Captured" className="w-full h-auto rounded-md" />
            {predictions.length > 0 && ( // 予測結果がある場合のみ表示
              <div className="mt-2 p-2 bg-gray-100 rounded">
                {predictions.map((prediction, index) => (
                  <p key={index} className="text-sm text-gray-700">
                    <span className="font-semibold">予測:</span> {prediction.className} ({prediction.probability}%)
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
        {!model && (
          <p className="mt-4 text-sm text-gray-600 text-center">
            ここでプレビューするには、左側のトレーニングセクションでモデルをトレーニングしてください。
          </p>
        )}
      </div>
    </div>
  );
};

export default PreviewNode;