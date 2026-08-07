import { useState } from "react";
import { RubyText, pairsFromDict } from "../components/RubyText";
import { pinyinDB, vocabularyList, products, NUM_MAP, type TbProduct } from "../data/hocgiatienData";

// Ported from chuxin-teachers-docs/k34/hocgiatien.html
// "淘小铺 (Taobao Shop)" — HSK1 shop-chat checkout simulator.

function Ruby({ text }: { text: string }) {
  return <RubyText pairs={pairsFromDict(text, pinyinDB)} fallback={text} />;
}

type ChatMsg = { role: "seller" | "customer"; text: string };
type Phase = "shop" | "qty" | "confirm" | "pay" | "done";

export function ShoppingPricePage() {
  const [showPinyin, setShowPinyin] = useState(true);
  const [vocabOpen, setVocabOpen] = useState(false);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "seller", text: "你好！欢迎光临！你想买什么？" },
  ]);
  const [phase, setPhase] = useState<Phase>("shop");
  const [activeProduct, setActiveProduct] = useState<TbProduct | null>(null);
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [checkoutItems, setCheckoutItems] = useState<string[]>([]);
  const [checkoutDisabled, setCheckoutDisabled] = useState(false);

  function addMsg(role: ChatMsg["role"], text: string) {
    setMessages((prev) => [...prev, { role, text }]);
  }

  function resetGame() {
    setCart({});
    setMessages([{ role: "seller", text: "你好！欢迎光临！你想买什么？" }]);
    setPhase("shop");
    setActiveProduct(null);
    setCheckoutDisabled(false);
  }

  function selectProduct(p: TbProduct) {
    addMsg("customer", `我想买${p.name}。`);
    setActiveProduct(p);
    setPhase("qty");
    setTimeout(() => {
      addMsg("seller", `好的，这个${p.name}很不错。你要几个？`);
    }, 600);
  }

  function addToCart(p: TbProduct, qty: number) {
    setCart((prev) => ({ ...prev, [p.id]: (prev[p.id] ?? 0) + qty }));
    addMsg("customer", `我要${NUM_MAP[qty]}${p.unit}。`);
    setTimeout(() => {
      addMsg("seller", "没问题。还要别的吗？");
      setPhase("shop");
    }, 600);
  }

  function startCheckout() {
    setCheckoutDisabled(true);
    addMsg("customer", "不要了，结账吧。");

    const itemsText: string[] = [];
    let total = 0;
    for (const [id, qty] of Object.entries(cart)) {
      const p = products.find((x) => x.id === Number(id))!;
      total += qty * p.price;
      const qText = qty === 2 ? "两" : String(qty);
      itemsText.push(`${qText}${p.unit}${p.name}`);
    }
    const longSentence = `好的。${itemsText.join("，")}，一共${total}块钱。对吗？`;

    setTimeout(() => {
      addMsg("seller", longSentence);
      setCheckoutItems(itemsText);
      setCheckoutTotal(total);
      setPhase("confirm");
    }, 1000);
  }

  function confirmOrder() {
    addMsg("customer", "对。");
    setTimeout(() => {
      addMsg("seller", "请问，您怎么支付？支付宝还是微信？");
      setPhase("pay");
    }, 800);
  }

  function processPayment(method: "Alipay" | "WeChat" | "Cash") {
    const text = method === "Alipay" ? "我用支付宝。" : method === "WeChat" ? "我用微信。" : "我付现金。";
    addMsg("customer", text);
    setTimeout(() => {
      const reply = method === "Cash" ? "好的，收您现金。" : "好的，请扫码。";
      addMsg("seller", reply);
      setTimeout(() => {
        addMsg("seller", "谢谢！欢迎下次光临！");
        setPhase("done");
      }, 1000);
    }, 800);
  }

  let count = 0;
  let total = 0;
  for (const [id, qty] of Object.entries(cart)) {
    const p = products.find((x) => x.id === Number(id));
    if (!p) continue;
    count += qty;
    total += qty * p.price;
  }

  return (
    <div className={`sp-shell ${showPinyin ? "sp-show-pinyin" : ""}`}>
      <header className="sp-header">
        <div className="sp-top-nav">
          <div className="sp-shop-info">
            <div className="sp-shop-avatar">🏬</div>
            <div className="sp-shop-name">
              <h1><Ruby text="淘小铺" /></h1>
            </div>
            <div className="sp-shop-badge"><Ruby text="正品" /></div>
          </div>
          <div className="sp-tool-bar">
            <button
              className={`sp-btn-pill ${showPinyin ? "sp-active" : ""}`}
              onClick={() => setShowPinyin((v) => !v)}
            >
              拼
            </button>
            <button className="sp-btn-pill" onClick={() => setVocabOpen(true)}>📖</button>
            <button className="sp-btn-pill" onClick={resetGame}>↻</button>
          </div>
        </div>
        <div className="sp-search-bar">
          🔍 <span><Ruby text="搜索宝贝" />...</span>
        </div>
      </header>

      <div className="sp-container">
        <div className="sp-chat-panel">
          <div className="sp-chat-header">💬 <Ruby text="淘小铺客服" /></div>
          <div className="sp-chat-body">
            {messages.map((m, i) => (
              <div className={`sp-msg sp-msg-${m.role}`} key={i}>
                <Ruby text={m.text} />
              </div>
            ))}
          </div>
        </div>

        <div className="sp-shop-panel">
          {phase === "shop" && (
            <div className="sp-grid-products">
              {products.map((p) => (
                <div className="sp-tb-card" key={p.id} onClick={() => selectProduct(p)}>
                  <div className="sp-tb-img-placeholder">
                    {p.emoji}
                    <span className="sp-tb-tag"><Ruby text={p.tag} /></span>
                    {cart[p.id] ? <div className="sp-cart-badge-overlay">{cart[p.id]}</div> : null}
                  </div>
                  <div className="sp-tb-info">
                    <div className="sp-tb-title"><Ruby text={p.name} /></div>
                    <div>
                      <div className="sp-tb-price-row">
                        <span className="sp-tb-symbol">¥</span>
                        <span className="sp-tb-price">{p.price}</span>
                        <span className="sp-tb-unit">/<Ruby text={p.unit} /></span>
                      </div>
                      <div className="sp-tb-meta">
                        <span className="sp-tb-sales">{p.sales}<Ruby text="人付款" /></span>
                        <div className="sp-tb-cart-btn">🛒</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {phase === "qty" && activeProduct && (
            <div className="sp-interaction-box">
              <div className="sp-qty-emoji">{activeProduct.emoji}</div>
              <h3><Ruby text={activeProduct.name} /></h3>
              <p className="sp-qty-hint"><Ruby text="你要几个" />?</p>
              <div className="sp-qty-buttons">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} className="sp-qty-btn" onClick={() => addToCart(activeProduct, n)}>{n}</button>
                ))}
              </div>
              <button className="sp-btn-back" onClick={() => setPhase("shop")}>
                ← <Ruby text="看别的" />
              </button>
            </div>
          )}

          {phase === "confirm" && (
            <div className="sp-interaction-box">
              <h3 className="sp-confirm-title"><Ruby text="确认订单" /></h3>
              <div className="sp-confirm-items">
                {checkoutItems.map((t, i) => (
                  <div key={i}><Ruby text={t} /></div>
                ))}
              </div>
              <button className="sp-btn-submit sp-btn-full" onClick={confirmOrder}><Ruby text="对" /></button>
            </div>
          )}

          {phase === "pay" && (
            <div className="sp-interaction-box">
              <h3><Ruby text="支付" /> - ¥{checkoutTotal}</h3>
              <div className="sp-pay-grid">
                <div className="sp-pay-item" onClick={() => processPayment("Alipay")}>
                  <div className="sp-pay-icon">🅰️</div>
                  <div><Ruby text="支付宝" /></div>
                </div>
                <div className="sp-pay-item" onClick={() => processPayment("WeChat")}>
                  <div className="sp-pay-icon">💬</div>
                  <div><Ruby text="微信" /></div>
                </div>
                <div className="sp-pay-item" onClick={() => processPayment("Cash")}>
                  <div className="sp-pay-icon">💵</div>
                  <div><Ruby text="现金" /></div>
                </div>
              </div>
            </div>
          )}

          {phase === "done" && (
            <div className="sp-done-box">
              <div className="sp-done-icon">✅</div>
              <h2><Ruby text="支付成功" /></h2>
              <button className="sp-btn-pill sp-active sp-done-btn" onClick={resetGame}>
                <Ruby text="再买一次" />
              </button>
            </div>
          )}
        </div>
      </div>

      {count > 0 && phase !== "done" && (
        <div className="sp-bottom-bar">
          <div className="sp-total-section">
            <div className="sp-total-label"><Ruby text="已选" />: {count}</div>
            <div className="sp-total-price">
              <span className="sp-yen">¥</span>{total}
            </div>
          </div>
          <button className="sp-btn-submit" onClick={startCheckout} disabled={checkoutDisabled}>
            <Ruby text="结账" />
          </button>
        </div>
      )}

      {vocabOpen && (
        <div className="sp-modal-overlay" onClick={() => setVocabOpen(false)}>
          <div className="sp-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="sp-modal-header">
              <h3>📖 <Ruby text="词汇表" /></h3>
              <span className="sp-modal-close" onClick={() => setVocabOpen(false)}>✕</span>
            </div>
            <div className="sp-modal-body">
              <table className="sp-vocab-table">
                <tbody>
                  {vocabularyList.map((v) => (
                    <tr key={v.ch}>
                      <td className="sp-vocab-zh"><Ruby text={v.ch} /></td>
                      <td className="sp-vocab-mean">{v.vn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
