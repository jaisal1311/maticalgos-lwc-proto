import Head from "next/head";
import ddPeriod from "../data/ddperiod.json";
import returns from "../data/returns.json";
import { useEffect, useMemo, useRef, useState } from "react";
import { ColorType, createChart } from "lightweight-charts";
import { isAfter, eachDayOfInterval, format, differenceInDays } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

export default function Home() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const datedMap = useMemo(() => {
    const valueMap = new Map<string, number>();
    returns.data.combined.forEach((value) => {
      valueMap.set(value.date, value.cumsum);
    });
    return valueMap;
  }, []);

  const sortedIntervals = useMemo(() => {
    const intervals = ddPeriod.data;
    intervals.sort((a, b) => {
      const dateA = new Date(a.Start_Date).getTime();
      const dateB = new Date(b.Start_Date).getTime();
      return dateA - dateB;
    });

    const mergedIntervals = [];

    mergedIntervals.push(intervals[0]);
    let maxEndDate = mergedIntervals[0].End_Date;
    for (let i = 1; i < intervals.length; i++) {
      if (isAfter(intervals[i].Start_Date, maxEndDate)) {
        mergedIntervals.push(intervals[i]);
        maxEndDate = intervals[i].End_Date;
      } else if (isAfter(intervals[i].End_Date, maxEndDate)) {
        mergedIntervals[mergedIntervals.length - 1].End_Date =
          intervals[i].End_Date;
        maxEndDate = intervals[i].End_Date;
      }
    }
    return mergedIntervals.map((period) => {
      return eachDayOfInterval({
        start: period.Start_Date,
        end: period.End_Date,
      }).reduce<{ time: string; value: number }[]>((prev, date) => {
        const key = format(date, "yyyy-MM-dd");
        if (datedMap.has(key)) {
          prev.push({ time: key, value: datedMap.get(key)! });
        }
        return prev;
      }, []);
    });
  }, [datedMap]);

  useEffect(() => {
    const chart = createChart(chartContainerRef.current, {
      layout: {
        textColor: "#000",
        background: { type: ColorType.Solid, color: "transparent" },
      },
      width: chartContainerRef.current?.clientWidth,
      height: 300,
      leftPriceScale: {
        visible: true,
        ticksVisible: true,
      },
      rightPriceScale: {
        visible: false,
      },
    });
    if (chartContainerRef.current) {
      chart.timeScale().fitContent();

      const newSeries = chart.addLineSeries({
        color: "gray",
      });
      newSeries.setData(
        returns.data.combined.map((data) => ({
          time: data.date,
          value: data.cumsum,
        }))
      );

      sortedIntervals.forEach((intervals) => {
        const highlightSeries = chart.addAreaSeries({
          lastValueVisible: false,
          lineColor: "red",
          topColor: "#ff000090",
          bottomColor: "#ffffff01",
        });

        highlightSeries.setData(intervals);
      });

      const wImage = new Image();
      wImage.src =
        "data:image/png;base64,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"; // Path to your watermark image
      wImage.style.position = "absolute";
      wImage.style.top = "0px";
      wImage.style.left = "270px";
      wImage.style.opacity = "0.2";
      wImage.style.height = "275px";
      chartContainerRef.current.appendChild(wImage);
    }

    return () => {
      chart.remove();
    };
  }, [sortedIntervals]);

  return (
    <>
      <Head>
        <title>Matic Algos</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        style={{ flexDirection: "row", display: "flex", position: "relative" }}
      >
        <div
          ref={chartContainerRef}
          style={{ maxWidth: "80%", height: "100%", width: "100%" }}
        />
        <TableContainer>
          <Table sx={{ borderRadius: 4, border: "solid", overflow: "clip" }}>
            <TableHead sx={{ bgcolor: "#f2f2f2" }}>
              <TableRow>
                <TableCell>Period</TableCell>
                <TableCell>Max DD</TableCell>
                <TableCell>Days</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ddPeriod.data.map((dd) => (
                <TableRow key={`${dd.Start_Date}-${dd.End_Date}`}>
                  <TableCell>{`${dd.Start_Date} ${dd.End_Date}`}</TableCell>
                  <TableCell>{dd.Max_Drawdown.toFixed(2)}</TableCell>
                  <TableCell>
                    {differenceInDays(dd.End_Date, dd.Start_Date)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </>
  );
}
