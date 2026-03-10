// Fix: recharts JSX elements implicitly typed as 'any' (ts7026)
// This is a known recharts issue - this declaration file resolves it
declare module 'recharts' {
    import { ComponentType, SVGProps, ReactNode, CSSProperties } from 'react'

    interface CommonProps {
        className?: string
        style?: CSSProperties
        children?: ReactNode
    }

    export const AreaChart: ComponentType<any>
    export const Area: ComponentType<any>
    export const BarChart: ComponentType<any>
    export const Bar: ComponentType<any>
    export const LineChart: ComponentType<any>
    export const Line: ComponentType<any>
    export const PieChart: ComponentType<any>
    export const Pie: ComponentType<any>
    export const Cell: ComponentType<any>
    export const XAxis: ComponentType<any>
    export const YAxis: ComponentType<any>
    export const CartesianGrid: ComponentType<any>
    export const Tooltip: ComponentType<any>
    export const Legend: ComponentType<any>
    export const ResponsiveContainer: ComponentType<any>
    export const ComposedChart: ComponentType<any>
    export const Scatter: ComponentType<any>
    export const RadarChart: ComponentType<any>
    export const Radar: ComponentType<any>
    export const RadialBarChart: ComponentType<any>
    export const RadialBar: ComponentType<any>
    export const ReferenceLine: ComponentType<any>
    export const ReferenceArea: ComponentType<any>
    export const Brush: ComponentType<any>
    export const Label: ComponentType<any>
    export const LabelList: ComponentType<any>
    export const Text: ComponentType<any>
    export const Sector: ComponentType<any>
    export const Curve: ComponentType<any>
    export const Rectangle: ComponentType<any>
    export const Dot: ComponentType<any>
    export const Cross: ComponentType<any>
    export const Symbols: ComponentType<any>
    export const ErrorBar: ComponentType<any>
}