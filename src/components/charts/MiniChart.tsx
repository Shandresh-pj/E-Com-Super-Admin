import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
  G,
  Line,
} from 'react-native-svg';
import { useTheme } from '../../theme/theme';

interface MiniChartProps {
  data?: number[];
  color?: string;
  height?: number;
}

interface CurvePath {
  line: string;
  fillD: string;
  points: Array<{ x: number; y: number }>;
}

// Convert data points to SVG smooth bezier curve path
const buildCurvePath = (data: number[], chartWidth: number, chartHeight: number): CurvePath => {
  const padding = 12;
  const maxVal = Math.max(...data, 1);
  const minVal = Math.min(...data, 0);
  const range = maxVal - minVal || 1;

  const pts = data.map((val, i) => ({
    x: (i / (data.length - 1)) * (chartWidth - padding * 2) + padding,
    y: chartHeight - padding - ((val - minVal) / range) * (chartHeight - padding * 2),
  }));

  let line = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1].x + pts[i].x) / 2;
    line += ` C ${cpx},${pts[i - 1].y} ${cpx},${pts[i].y} ${pts[i].x},${pts[i].y}`;
  }

  const fillD = `${line} L ${pts[pts.length - 1].x},${chartHeight} L ${pts[0].x},${chartHeight} Z`;

  return { line, fillD, points: pts };
};

export const MiniChart: React.FC<MiniChartProps> = ({
  data = [0, 0],
  color,
  height = 88,
}) => {
  const theme = useTheme();
  const strokeColor = color || theme.colors.primary;
  const chartWidth = 300;

  // Guard: need at least 2 data points for a bezier curve
  const safeData = data.length >= 2 ? data : (data.length === 1 ? [0, data[0]] : [0, 0]);
  const { line, fillD, points } = buildCurvePath(safeData, chartWidth, height);

  return (
    <View style={[styles.container, { height }]}>
      <Svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
        <Defs>
          <LinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={strokeColor} stopOpacity="0.22" />
            <Stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Subtle horizontal grid lines */}
        {[0.33, 0.66].map((frac, i) => (
          <Line
            key={i}
            x1={12}
            y1={height * frac}
            x2={chartWidth - 12}
            y2={height * frac}
            stroke={strokeColor}
            strokeOpacity="0.07"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
        ))}

        {/* Gradient fill under the curve */}
        <Path d={fillD} fill="url(#chartFill)" />

        {/* Main bezier curve line */}
        <Path
          d={line}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data point dots — last point highlighted */}
        <G>
          {points.map((pt, i) => {
            const isLast = i === points.length - 1;
            return (
              <Circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={isLast ? 5 : 2.5}
                fill={strokeColor}
                fillOpacity={isLast ? 1 : 0.35}
                stroke={isLast ? '#ffffff' : 'none'}
                strokeWidth={isLast ? 2 : 0}
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
    overflow: 'hidden',
  },
});
