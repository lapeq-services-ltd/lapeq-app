import Svg, { Path } from "react-native-svg";
import { LOGO_PATHS } from "@/assets/logo/logoPaths";

export default function LapeqLogo({ size = 36 }: { size?: number }) {
    return (
        <Svg width={size} height={size} viewBox="120 100 280 330">
            {LOGO_PATHS.map((p, i) => (
                <Path key={i} fill={p.fill} d={p.d} />
            ))}
        </Svg>
    );
}
