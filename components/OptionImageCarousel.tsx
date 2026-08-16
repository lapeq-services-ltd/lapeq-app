import { useState } from "react";
import { View, Image, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from "react-native";

const GOLD = "#c9a84c";

type OptionLike = { images?: string[]; image?: string } | null | undefined;

interface Props {
    option: OptionLike;
    height?: number;
}

export default function OptionImageCarousel({ option, height = 160 }: Props) {
    const [width, setWidth] = useState(0);
    const [active, setActive] = useState(0);

    const images = option?.images?.length ? option.images : (option?.image ? [option.image] : []);
    if (images.length === 0) return null;

    const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (width > 0) setActive(Math.round(e.nativeEvent.contentOffset.x / width));
    };

    return (
        <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ width: "100%", height }}>
            {width > 0 && (
                <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={onScrollEnd}
                    scrollEventThrottle={16}
                >
                    {images.map((uri, i) => (
                        <Image key={i} source={{ uri }} style={{ width, height }} resizeMode="cover" />
                    ))}
                </ScrollView>
            )}
            {images.length > 1 && (
                <View style={{ position: "absolute", bottom: 10, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 5 }}>
                    {images.map((_, i) => (
                        <View
                            key={i}
                            style={{
                                height: 6,
                                borderRadius: 3,
                                width: i === active ? 16 : 6,
                                backgroundColor: i === active ? GOLD : "rgba(255,255,255,0.5)",
                            }}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}
