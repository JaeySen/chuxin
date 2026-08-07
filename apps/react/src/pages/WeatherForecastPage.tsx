import { useState } from "react";
import type { PinyinPairs } from "../components/RubyText";

// Ported from chuxin-teachers-docs/k34/dubaothoitiet.html
// "🇨🇳 Dự Báo Thời Tiết Trung Quốc" — HSK 1-2 listening/reading practice.

type CityCard = {
  id: string;
  name: PinyinPairs;
  icon: string;
  temp: string;
  detail: PinyinPairs;
  viet: string;
};

const REPORTER_INTRO: PinyinPairs = [
  ["大家", "Dàjiā"],
  ["好，", "hǎo,"],
  ["今天", "jīntiān"],
  ["我们", "wǒmen"],
  ["看看", "kànkan"],
  ["天气。", "tiānqì."],
];

const CITIES: CityCard[] = [
  {
    id: "beijing",
    name: [["北京", "Běijīng"]],
    icon: "❄️",
    temp: "-5°C",
    detail: [["天气", "Tiānqì"], ["太", "tài"], ["冷", "lěng"], ["了", "le"]],
    viet: "Thời tiết quá lạnh rồi.",
  },
  {
    id: "shanghai",
    name: [["上海", "Shànghǎi"]],
    icon: "🌧️",
    temp: "18°C",
    detail: [["今天", "Jīntiān"], ["会", "huì"], ["下", "xià"], ["雨", "yǔ"]],
    viet: "Hôm nay sẽ có mưa.",
  },
  {
    id: "hangzhou",
    name: [["杭州", "Hángzhōu"]],
    icon: "☀️",
    temp: "35°C",
    detail: [["天气", "Tiānqì"], ["太", "tài"], ["热", "rè"], ["了", "le"]],
    viet: "Thời tiết nóng quá.",
  },
  {
    id: "suzhou",
    name: [["苏州", "Sūzhōu"]],
    icon: "🌤️",
    temp: "22°C",
    detail: [["不", "Bù"], ["冷", "lěng"], ["不", "bù"], ["热", "rè"]],
    viet: "Không lạnh không nóng.",
  },
];

const SUMMARY_ROWS = [
  { city: "Bắc Kinh (Beijing)", weather: "Lạnh (Lěng)", grammar: "太...了 (Tài... le): Quá/Lắm" },
  { city: "Thượng Hải (Shanghai)", weather: "Mưa (Xià yǔ)", grammar: "会 (Huì): Sẽ (dự đoán)" },
  { city: "Hàng Châu (Hangzhou)", weather: "Nóng (Rè)", grammar: "太...了 (Tài... le): Quá/Lắm" },
  { city: "Tô Châu (Suzhou)", weather: "Tốt (Hǎo)", grammar: "不...不... (Bù... bù...): Không... không..." },
];

export function WeatherForecastPage() {
  const [hidePinyin, setHidePinyin] = useState(false);
  const [hideVietnamese, setHideVietnamese] = useState(false);
  const [round, setRound] = useState<1 | 2>(1);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  function setRoundAndReset(r: 1 | 2) {
    setRound(r);
    setRevealed(new Set());
  }

  function handleCardClick(id: string) {
    if (round !== 2) return;
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className={`wf-body ${hidePinyin ? "wf-hide-pinyin" : ""} ${hideVietnamese ? "wf-hide-vietnamese" : ""} ${round === 2 ? "wf-round-2" : ""}`}>
      <div className="wf-container">
        <header className="wf-header">
          <h1>🇨🇳 Dự Báo Thời Tiết Trung Quốc</h1>
          <p className="wf-subtitle">Bài thực hành nghe và đọc hiểu (HSK 1-2)</p>
        </header>

        <div className="wf-controls">
          <div className="wf-controls-row">
            <button className="wf-btn wf-btn-pinyin" onClick={() => setHidePinyin((v) => !v)}>🔤 Tắt/Bật Phiên Âm</button>
            <button className="wf-btn wf-btn-viet" onClick={() => setHideVietnamese((v) => !v)}>🇻🇳 Tắt/Bật Tiếng Việt</button>
          </div>
          <div className="wf-round-controls">
            <button
              className={`wf-btn wf-btn-round1 ${round === 1 ? "wf-active" : ""}`}
              onClick={() => setRoundAndReset(1)}
            >
              📖 Vòng 1: Học Tập
            </button>
            <button
              className={`wf-btn wf-btn-round2 ${round === 2 ? "wf-active" : ""}`}
              onClick={() => setRoundAndReset(2)}
            >
              🎯 Vòng 2: Kiểm Tra
            </button>
          </div>
        </div>

        {round === 2 && (
          <div className="wf-round-notification">
            <strong>Vòng 2 Bắt Đầu!</strong> Các chi tiết đã bị ẩn. Hãy nhìn biểu tượng và nhiệt độ, đọc to dự
            báo thời tiết, sau đó <strong>bấm vào thẻ</strong> để kiểm tra đáp án.
          </div>
        )}

        {/* Reporter intro */}
        <div className="wf-reporter-section">
          <div className="wf-reporter-avatar">👩‍💼</div>
          <div>
            <strong>Phóng viên Vương (Wáng):</strong>
            <div className="wf-chinese-text">
              {REPORTER_INTRO.map(([hanzi, pinyin], i) => (
                <span className="wf-char-group" key={i}>
                  <span className="wf-pinyin">{pinyin}</span>
                  <span className="wf-hanzi">{hanzi}</span>
                </span>
              ))}
            </div>
            <div className="wf-vietnamese-translation wf-reporter-viet">
              (Chào mọi người, hôm nay chúng ta cùng xem thời tiết.)
            </div>
          </div>
        </div>

        <div className="wf-weather-grid">
          {CITIES.map((city) => {
            const isRevealed = revealed.has(city.id);
            return (
              <div
                key={city.id}
                className={`wf-city-card ${round === 2 && isRevealed ? "wf-revealed" : ""}`}
                onClick={() => handleCardClick(city.id)}
              >
                <div className="wf-chinese-text wf-city-name">
                  {city.name.map(([hanzi, pinyin], i) => (
                    <span className="wf-char-group" key={i}>
                      <span className="wf-pinyin">{pinyin}</span>
                      <span className="wf-hanzi">{hanzi}</span>
                    </span>
                  ))}
                </div>
                <div className="wf-weather-icon">{city.icon}</div>
                <div className="wf-temp">{city.temp}</div>

                <div className="wf-click-hint">👇 Bấm để xem kết quả</div>

                <div className="wf-weather-detail-group">
                  <div className="wf-chinese-text">
                    {city.detail.map(([hanzi, pinyin], i) => (
                      <span className="wf-char-group" key={i}>
                        <span className="wf-pinyin">{pinyin}</span>
                        <span className="wf-hanzi">{hanzi}</span>
                      </span>
                    ))}
                  </div>
                  <p className="wf-vietnamese-translation">{city.viet}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="wf-summary-section">
          <h3 className="wf-summary-title">📝 Tổng Kết Từ Vựng &amp; Ngữ Pháp</h3>
          <table className="wf-table">
            <thead>
              <tr>
                <th>Thành phố (Chéngshì)</th>
                <th>Thời tiết (Tiānqì)</th>
                <th>Cấu trúc ngữ pháp</th>
              </tr>
            </thead>
            <tbody>
              {SUMMARY_ROWS.map((row) => (
                <tr key={row.city}>
                  <td>{row.city}</td>
                  <td>{row.weather}</td>
                  <td><b>{row.grammar.split(":")[0]}:</b>{row.grammar.split(":").slice(1).join(":")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
