import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type BusinessDay,
  type Time,
  type MouseEventParams,
  type CandlestickData,
  type HistogramData,
  type LineData,
} from "lightweight-charts";

interface PriceBar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface VolumeBar {
  time: string;
  value: number;
  color?: string;
}

interface LinePoint {
  time: string;
  value: number | null;
}

interface MacdPoint {
  time: string;
  macd: number | null;
  signal: number | null;
  histogram: number | null;
}

interface LightweightOhlcWindowProps {
  symbol: string;
  lookback?: string;
  interval?: string;
  source?: string;
  price: PriceBar[];
  volume: VolumeBar[];
  sma20?: LinePoint[];
  sma50?: LinePoint[];
  macd?: MacdPoint[];
}

interface LegendSnapshot {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  sma20?: number | null;
  sma50?: number | null;
  macd?: number | null;
  signal?: number | null;
  histogram?: number | null;
}

function toBusinessDay(date: string): BusinessDay {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day } as BusinessDay;
}

function timeToString(time: Time | undefined): string | null {
  if (!time) return null;
  if (typeof time === "string") return time;
  if (typeof time === "number") {
    const dt = new Date(time * 1000);
    return dt.toISOString().slice(0, 10);
  }
  const { year, month, day } = time as BusinessDay;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const formatNumber = (value: number | undefined, digits = 2) => {
  if (value === undefined || Number.isNaN(value)) return "—";
  return value.toFixed(digits);
};

const formatInteger = (value: number | undefined) => {
  if (value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    value,
  );
};

const LightweightOhlcWindow: React.FC<LightweightOhlcWindowProps> = ({
  symbol,
  lookback,
  interval,
  source,
  price,
  volume,
  sma20 = [],
  sma50 = [],
  macd = [],
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const priceSeriesData: CandlestickData[] = useMemo(
    () =>
      price.map((bar) => ({
        time: toBusinessDay(bar.time),
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
      })),
    [price],
  );

  const volumeSeriesData: HistogramData[] = useMemo(
    () =>
      volume.map((bar) => ({
        time: toBusinessDay(bar.time),
        value: bar.value,
        color: bar.color,
      })),
    [volume],
  );

  const sma20SeriesData: LineData[] = useMemo(
    () =>
      sma20
        .filter((point) => point.value !== null && point.value !== undefined)
        .map((point) => ({
          time: toBusinessDay(point.time),
          value: point.value as number,
        })),
    [sma20],
  );

  const sma50SeriesData: LineData[] = useMemo(
    () =>
      sma50
        .filter((point) => point.value !== null && point.value !== undefined)
        .map((point) => ({
          time: toBusinessDay(point.time),
          value: point.value as number,
        })),
    [sma50],
  );

  const macdHistogramData: HistogramData[] = useMemo(
    () =>
      macd
        .filter(
          (point) => point.histogram !== null && point.histogram !== undefined,
        )
        .map((point) => ({
          time: toBusinessDay(point.time),
          value: point.histogram as number,
          color:
            (point.histogram ?? 0) >= 0
              ? "rgba(16, 185, 129, 0.6)"
              : "rgba(239, 68, 68, 0.6)",
        })),
    [macd],
  );

  const macdLineData: LineData[] = useMemo(
    () =>
      macd
        .filter((point) => point.macd !== null && point.macd !== undefined)
        .map((point) => ({
          time: toBusinessDay(point.time),
          value: point.macd as number,
        })),
    [macd],
  );

  const macdSignalData: LineData[] = useMemo(
    () =>
      macd
        .filter((point) => point.signal !== null && point.signal !== undefined)
        .map((point) => ({
          time: toBusinessDay(point.time),
          value: point.signal as number,
        })),
    [macd],
  );

  const priceLookup = useMemo(
    () => new Map(price.map((p) => [p.time, p])),
    [price],
  );
  const volumeLookup = useMemo(
    () => new Map(volume.map((p) => [p.time, p.value])),
    [volume],
  );
  const sma20Lookup = useMemo(
    () => new Map(sma20.map((p) => [p.time, p.value])),
    [sma20],
  );
  const sma50Lookup = useMemo(
    () => new Map(sma50.map((p) => [p.time, p.value])),
    [sma50],
  );
  const macdLookup = useMemo(
    () => new Map(macd.map((p) => [p.time, p])),
    [macd],
  );

  const initialLegend = useMemo<LegendSnapshot | null>(() => {
    const last = price[price.length - 1];
    if (!last) return null;
    const time = last.time;
    return {
      time,
      open: last.open,
      high: last.high,
      low: last.low,
      close: last.close,
      volume: volumeLookup.get(time),
      sma20: sma20Lookup.get(time) ?? null,
      sma50: sma50Lookup.get(time) ?? null,
      macd: macdLookup.get(time)?.macd ?? null,
      signal: macdLookup.get(time)?.signal ?? null,
      histogram: macdLookup.get(time)?.histogram ?? null,
    };
  }, [price, volumeLookup, sma20Lookup, sma50Lookup, macdLookup]);

  const [legend, setLegend] = useState<LegendSnapshot | null>(initialLegend);

  useEffect(() => {
    setLegend(initialLegend);
  }, [initialLegend]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || priceSeriesData.length === 0) return;

    container.style.width = "100%";
    container.style.height = "100%";

    const host = container.parentElement || container;
    const initialRect = host.getBoundingClientRect();
    const headerHeight =
      headerRef.current?.getBoundingClientRect().height ?? 0;
    const chart = createChart(container, {
      width: Math.max(320, Math.floor(initialRect.width)) || 640,
      height:
        Math.max(240, Math.floor(initialRect.height - headerHeight)) || 480,
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#0f172a",
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(15, 23, 42, 0.3)", width: 1, style: 0 },
        horzLine: { color: "rgba(15, 23, 42, 0.3)", width: 1, style: 0 },
      },
      grid: {
        vertLines: { color: "#e2e8f0" },
        horzLines: { color: "#e2e8f0" },
      },
      timeScale: {
        borderColor: "#cbd5e1",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "#cbd5e1",
        scaleMargins: { top: 0.05, bottom: 0.55 },
      },
    });

    chartRef.current = chart;

    chart.applyOptions({
      attributionLogo: {
        visible: true,
        color: "#0ea5e9",
      },
    } as any);

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#16a34a",
      borderUpColor: "#16a34a",
      wickUpColor: "#16a34a",
      downColor: "#ef4444",
      borderDownColor: "#ef4444",
      wickDownColor: "#ef4444",
    });
    candleSeries.setData(priceSeriesData);

    const volumeSeries = chart.addHistogramSeries({
      priceScaleId: "volume",
      priceFormat: { type: "volume" },
      color: "rgba(148, 163, 184, 0.6)",
    });
    volumeSeries
      .priceScale()
      .applyOptions({ scaleMargins: { top: 0.55, bottom: 0.25 } });
    volumeSeries.setData(volumeSeriesData);

    if (sma20SeriesData.length) {
      const series = chart.addLineSeries({
        color: "#0ea5e9",
        lineWidth: 2,
      });
      series.setData(sma20SeriesData);
    }

    if (sma50SeriesData.length) {
      const series = chart.addLineSeries({
        color: "#f97316",
        lineWidth: 2,
      });
      series.setData(sma50SeriesData);
    }

    let macdHistogramSeries;
    let macdLineSeries;
    let macdSignalSeries;
    if (
      macdHistogramData.length ||
      macdLineData.length ||
      macdSignalData.length
    ) {
      macdHistogramSeries = chart.addHistogramSeries({
        priceScaleId: "macd",
        priceFormat: { type: "price", precision: 4, minMove: 0.0001 },
      });
      macdHistogramSeries
        .priceScale()
        .applyOptions({ scaleMargins: { top: 0.8, bottom: 0.05 } });
      macdHistogramSeries.setData(macdHistogramData);

      macdLineSeries = chart.addLineSeries({
        priceScaleId: "macd",
        color: "#f97316",
        lineWidth: 2,
      });
      macdLineSeries.setData(macdLineData);

      macdSignalSeries = chart.addLineSeries({
        priceScaleId: "macd",
        color: "#38bdf8",
        lineWidth: 2,
      });
      macdSignalSeries.setData(macdSignalData);
    }

    chart.timeScale().fitContent();
    chart.priceScale("right").applyOptions({
      autoScale: true,
      scaleMargins: { top: 0.08, bottom: 0.58 },
    });

    const updateLegend = (time: string) => {
      const priceBar = priceLookup.get(time);
      if (!priceBar) return;
      setLegend({
        time,
        open: priceBar.open,
        high: priceBar.high,
        low: priceBar.low,
        close: priceBar.close,
        volume: volumeLookup.get(time),
        sma20: sma20Lookup.get(time) ?? null,
        sma50: sma50Lookup.get(time) ?? null,
        macd: macdLookup.get(time)?.macd ?? null,
        signal: macdLookup.get(time)?.signal ?? null,
        histogram: macdLookup.get(time)?.histogram ?? null,
      });
    };

    const lastPrice = price[price.length - 1];
    if (lastPrice) updateLegend(lastPrice.time);

    const crosshairHandler = (param: MouseEventParams<Time>) => {
      const timeStr = timeToString(param.time);
      if (timeStr) {
        updateLegend(timeStr);
      } else if (lastPrice) {
        updateLegend(lastPrice.time);
      }
    };

    chart.subscribeCrosshairMove(crosshairHandler);

    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const { width, height } = entries[0].contentRect;
      const headerHeightCurrent =
        headerRef.current?.getBoundingClientRect().height ?? 0;
      chart.applyOptions({
        width: Math.max(320, Math.floor(width)),
        height: Math.max(
          240,
          Math.floor(height - headerHeightCurrent),
        ),
      });
      chart.priceScale("right").applyOptions({ autoScale: true });
    });
    observer.observe(host);
    resizeObserverRef.current = observer;

    return () => {
      chart.unsubscribeCrosshairMove(crosshairHandler);
      chart.remove();
      chartRef.current = null;
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, [
    price,
    priceSeriesData,
    volumeSeriesData,
    sma20SeriesData,
    sma50SeriesData,
    macdHistogramData,
    macdLineData,
    macdSignalData,
    priceLookup,
    volumeLookup,
    sma20Lookup,
    sma50Lookup,
    macdLookup,
  ]);

  const legendBlocks = useMemo(() => {
    if (!legend) return null;
    return (
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 12,
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 16px",
          padding: "10px 14px",
          borderRadius: "10px",
          background: "rgba(248, 250, 252, 0.9)",
          boxShadow: "0 10px 30px -20px rgba(15, 23, 42, 0.6)",
          color: "#0f172a",
          fontSize: "12px",
          pointerEvents: "none",
        }}
      >
        <div style={{ fontWeight: 600, fontSize: "12px" }}>{symbol}</div>
        <div style={{ color: "#475569" }}>{legend.time}</div>
        <div>O: {formatNumber(legend.open)}</div>
        <div>H: {formatNumber(legend.high)}</div>
        <div>L: {formatNumber(legend.low)}</div>
        <div>C: {formatNumber(legend.close)}</div>
        <div>Vol: {formatInteger(legend.volume)}</div>
        {legend.sma20 !== undefined && legend.sma20 !== null && (
          <div style={{ color: "#0ea5e9" }}>
            SMA20: {formatNumber(legend.sma20)}
          </div>
        )}
        {legend.sma50 !== undefined && legend.sma50 !== null && (
          <div style={{ color: "#f97316" }}>
            SMA50: {formatNumber(legend.sma50)}
          </div>
        )}
        {legend.macd !== undefined && legend.macd !== null && (
          <div style={{ color: "#f97316" }}>
            MACD: {formatNumber(legend.macd, 3)}
          </div>
        )}
        {legend.signal !== undefined && legend.signal !== null && (
          <div style={{ color: "#38bdf8" }}>
            Signal: {formatNumber(legend.signal, 3)}
          </div>
        )}
        {legend.histogram !== undefined && legend.histogram !== null && (
          <div style={{ color: legend.histogram >= 0 ? "#16a34a" : "#ef4444" }}>
            Hist: {formatNumber(legend.histogram, 3)}
          </div>
        )}
      </div>
    );
  }, [legend, symbol]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
        background: "#ffffff",
      }}
    >
      <div
        ref={headerRef}
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#ffffff",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontWeight: 600, color: "#0f172a" }}>
            {symbol} · {lookback || "—"} · {interval || "—"}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>
            Source: {source || "—"} • Powered by{" "}
            <a
              href="https://www.tradingview.com/"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#0ea5e9", textDecoration: "none" }}
            >
              TradingView Lightweight Charts
            </a>
          </div>
        </div>
      </div>
      <div
        ref={containerRef}
        style={{
          position: "relative",
          flex: 1,
        }}
      >
        {legendBlocks}
      </div>
    </div>
  );
};

export default LightweightOhlcWindow;
