const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../app/services/diaspora-support.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Replace imports (add ChevronUp and define SUGGESTIONS + getFlagEmoji)
const oldImports = `import { Briefcase, Check, FileText, ChevronLeft, ChevronDown, Search, X, Plus, Minus } from "lucide-react-native";
import VoiceInput from "@/components/VoiceInput";`;

const newImports = `import { Briefcase, Check, FileText, ChevronLeft, ChevronDown, ChevronUp, Search, X, Plus, Minus } from "lucide-react-native";
import VoiceInput from "@/components/VoiceInput";

const SUGGESTIONS = [
    { label: "UAE", display: "UAE 🇦🇪" },
    { label: "Australia", display: "Australia 🇦🇺" },
    { label: "South Africa", display: "South Africa 🇿🇦" },
    { label: "Ireland", display: "Ireland 🇮🇪" },
    { label: "Ghana", display: "Ghana 🇬🇭" },
    { label: "Malaysia", display: "Malaysia 🇲🇾" }
];

const getFlagEmoji = (countryName: string) => {
    const list = [
        { name: "Australia", flag: "🇦🇺" },
        { name: "South Africa", flag: "🇿🇦" },
        { name: "Ireland", flag: "🇮🇪" },
        { name: "Ghana", flag: "🇬🇭" },
        { name: "Malaysia", flag: "🇲🇾" },
        { name: "UAE", flag: "🇦🇪" },
        { name: "United Arab Emirates", flag: "🇦🇪" },
        { name: "France", flag: "🇫🇷" },
        { name: "Germany", flag: "🇩🇪" }
    ];
    const found = list.find(x => x.name.toLowerCase() === countryName.trim().toLowerCase());
    return found ? found.flag : "🌍";
};`;

if (!content.includes(oldImports)) {
    console.error("Error: oldImports target not found in diaspora-support.tsx!");
    process.exit(1);
}
content = content.replace(oldImports, newImports);

// 2. Replace state variables and country selection handlers
const oldStates = `    const [serviceType, setServiceType] = useState("Homecoming Protocol");
    const [country, setCountry] = useState("");
    const [isOtherSelected, setIsOtherSelected] = useState(false);
    const [budgetAmount, setBudgetAmount] = useState(500000); // Defaults to ₦500k
    const [timeline, setTimeline] = useState("");
    const [details, setDetails] = useState("");
    const [loading, setLoading] = useState(false);
    const [showError, setShowError] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const scrollRef = useRef<ScrollView>(null);
    const detailsY = useRef(0);
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;

    const filteredCountries = useMemo(() => {
        return OTHER_COUNTRIES.filter(c => c.display.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [searchQuery]);

    const handleSelectCountry = (countryLabel: string) => {
        const isImportant = IMPORTANT_COUNTRIES.some(c => c.label === countryLabel);
        if (isImportant) {
            setCountry(countryLabel);
            setIsOtherSelected(false);
        } else {
            setCountry(countryLabel);
            setIsOtherSelected(true);
        }
    };

    const handleSelectOther = () => {
        setShowCountryModal(true);
    };`;

const newStates = `    const [serviceType, setServiceType] = useState("Homecoming Protocol");
    const [country, setCountry] = useState("");
    const [isOtherSelected, setIsOtherSelected] = useState(false);
    const [otherCountry, setOtherCountry] = useState("");
    const [pkgExpanded, setPkgExpanded] = useState(false);
    const [budgetAmount, setBudgetAmount] = useState(500000); // Defaults to ₦500k
    const [timeline, setTimeline] = useState("");
    const [details, setDetails] = useState("");
    const [loading, setLoading] = useState(false);
    const [showError, setShowError] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const scrollRef = useRef<ScrollView>(null);
    const detailsY = useRef(0);
    const alertOpacity = useRef(new Animated.Value(0)).current;
    const alertScale = useRef(new Animated.Value(0.9)).current;

    const handleSelectCountry = (countryLabel: string) => {
        setCountry(countryLabel);
        setIsOtherSelected(false);
        setOtherCountry("");
    };

    const handleSelectOther = () => {
        setCountry("Other");
        setIsOtherSelected(true);
    };`;

if (!content.includes(oldStates)) {
    console.error("Error: oldStates target not found in diaspora-support.tsx!");
    process.exit(1);
}
content = content.replace(oldStates, newStates);

// 3. Replace handleSubmit and otherInfo logic
const oldSubmit = `    const handleSubmit = async () => {
        if (!country || !details) {
            setShowError(true);
            return;
        }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);
        const formattedBudget = formatBudget(budgetAmount);
        
        const { error } = await supabase.from("requests").insert({
            user_id: user?.id,
            service_type: "diaspora-support",
            status: "pending",
            reference: ref,
            title: \`Diaspora Support - \${serviceType}\`,
            details: { package: serviceType, country, budget: formattedBudget, timeline, details },
        });

        setLoading(false);
        if (!error) {
            setShowSuccess(true);
            Animated.parallel([
                Animated.timing(alertOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.spring(alertScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
            ]).start();
        } else {
            Alert.alert("Submission Failed", error.message);
        }
    };

    const getSelectedOtherInfo = () => {
        if (!isOtherSelected || !country) return { name: "Other", flag: "🌍" };
        const found = OTHER_COUNTRIES.find(c => c.label === country);
        return found ? { name: found.name, flag: found.flag } : { name: country, flag: "🌍" };
    };

    const otherInfo = getSelectedOtherInfo();`;

const newSubmit = '    const handleSubmit = async () => {\n' +
'        if (!country || (isOtherSelected && !otherCountry.trim()) || !details) {\n' +
'            setShowError(true);\n' +
'            return;\n' +
'        }\n' +
'        setLoading(true);\n' +
'        const { data: { user } } = await supabase.auth.getUser();\n' +
'        const ref = "LPQ-" + Date.now().toString(36).toUpperCase().slice(-5);\n' +
'        const formattedBudget = formatBudget(budgetAmount);\n' +
'        \n' +
'        const dbCountry = isOtherSelected ? `Other (${otherCountry.trim()})` : country;\n' +
'\n' +
'        const { error } = await supabase.from("requests").insert({\n' +
'            user_id: user?.id,\n' +
'            service_type: "diaspora-support",\n' +
'            status: "pending",\n' +
'            reference: ref,\n' +
'            title: `Diaspora Support - ${serviceType}`,\n' +
'            details: { package: serviceType, country: dbCountry, budget: formattedBudget, timeline, details },\n' +
'        });\n' +
'\n' +
'        setLoading(false);\n' +
'        if (!error) {\n' +
'            setShowSuccess(true);\n' +
'            Animated.parallel([\n' +
'                Animated.timing(alertOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),\n' +
'                Animated.spring(alertScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),\n' +
'            ]).start();\n' +
'        } else {\n' +
'            Alert.alert("Submission Failed", error.message);\n' +
'        }\n' +
'    };';

if (!content.includes(oldSubmit)) {
    console.error("Error: oldSubmit target not found in diaspora-support.tsx!");
    process.exit(1);
}
content = content.replace(oldSubmit, newSubmit);

// 4. Replace ScrollView and Form markup including Modal
const oldScrollViewAndForm = `                <ScrollView
                    ref={scrollRef}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <ChevronLeft size={22} color={C.text} />
                        <Text style={[s.backText, { color: C.text }]}>Back</Text>
                    </TouchableOpacity>

                    <Text style={[s.title, { color: C.text }]}>Diaspora Support</Text>
                    <Text style={[s.subtitle, { color: C.muted }]}>Remote assistance for Nigerians abroad</Text>

                    {/* Country of Residence Selection (Directly at the Top in Square Grid) */}
                    <View style={s.section}>
                        <Text style={[s.label, { color: C.text }]}>Country of Residence *</Text>
                        <Text style={[s.sectionDesc, { color: C.muted }]}>Where are you requesting this service from?</Text>
                        <View style={s.countryGrid}>
                            {IMPORTANT_COUNTRIES.map((c) => {
                                const isSelected = country === c.label && !isOtherSelected;
                                return (
                                    <TouchableOpacity
                                        key={c.label}
                                        style={[s.countryCard, isSelected && s.countryCardActive]}
                                        onPress={() => handleSelectCountry(c.label)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={s.countryCardFlag}>{c.flag}</Text>
                                        <Text numberOfLines={1} adjustsFontSizeToFit style={[s.countryCardName, { color: C.text }]}>{c.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                            <TouchableOpacity
                                style={[s.countryCard, isOtherSelected && s.countryCardActive]}
                                onPress={handleSelectOther}
                                activeOpacity={0.8}
                            >
                                <Text style={s.countryCardFlag}>{otherInfo.flag}</Text>
                                <Text numberOfLines={1} adjustsFontSizeToFit style={[s.countryCardName, { color: C.text }]}>
                                    {isOtherSelected ? otherInfo.name : "Other"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Package Selection */}
                    <View style={s.section}>
                        <Text style={[s.label, { color: C.text }]}>Select Package *</Text>
                        <View style={s.packageList}>
                            {PACKAGES.map((pkg) => {
                                const isSelected = serviceType === pkg.id;
                                const IconComponent = pkg.Icon;
                                return (
                                    <TouchableOpacity
                                        key={pkg.id}
                                        style={[s.packageCard, isSelected && s.packageCardActive]}
                                        onPress={() => setServiceType(pkg.id)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={s.packageHeader}>
                                            <View style={[s.packageIconWrap, isSelected && s.packageIconWrapActive]}>
                                                <IconComponent size={18} color={isSelected ? GOLD : C.text} />
                                            </View>
                                            <Text style={[s.packageLabel, { color: C.text }]}>{pkg.label}</Text>
                                        </View>
                                        <Text style={[s.packageDesc, { color: C.muted }]}>{pkg.desc}</Text>
                                        <Text style={s.packageBullet}>• {pkg.bullet}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Estimated Budget Stepper */}
                    <View style={s.section}>
                        <Text style={[s.label, { color: C.text }]}>Estimated Budget *</Text>
                        <BudgetStepper
                            value={budgetAmount}
                            onChange={setBudgetAmount}
                            min={250000} // Minimum ₦250k
                            step={250000} // Increment by ₦250k
                            label="Estimated Service Budget"
                            C={C}
                            theme={theme}
                        />
                    </View>

                    {/* Timeline */}
                    <View style={s.section}>
                        <Text style={[s.label, { color: C.text }]}>Timeline</Text>
                        <TextInput
                            style={[s.input, { color: C.text }]}
                            placeholder="e.g. Within 2 weeks"
                            placeholderTextColor={C.muted}
                            value={timeline}
                            onChangeText={setTimeline}
                            returnKeyType="done"
                            onSubmitEditing={() => Keyboard.dismiss()}
                        />
                    </View>

                    {/* Details input with VoiceInput */}
                    <View style={s.section}>
                        <Text style={[s.label, { color: C.text }]} onLayout={e => { detailsY.current = e.nativeEvent.layout.y; }}>
                            Details *
                        </Text>
                        <VoiceInput
                            placeholder="Describe what you need help with in detail..."
                            value={details}
                            onChange={setDetails}
                            accent={GOLD}
                            textColor={C.text}
                            border={showError && !details ? "#ef5350" : C.border}
                            inputBg={C.surface}
                        />
                    </View>

                    {showError && (!country || !details) && (
                        <Text style={s.errorText}>Please fill in all required fields.</Text>
                    )}

                    <TouchableOpacity
                        style={[s.btn, loading && s.btnDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        <Text style={[s.btnText, { color: C.background }]}>
                            {loading ? "Submitting..." : "Submit Request"}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Country Picker Modal ("Suggestions" when selecting Other) */}
            <Modal visible={showCountryModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCountryModal(false)}>
                <View style={[s.modalRoot, { backgroundColor: C.background }]}>
                    <View style={s.modalHeader}>
                        <Text style={[s.modalTitleText, { color: C.text }]}>Other Country Suggestions</Text>
                        <TouchableOpacity onPress={() => setShowCountryModal(false)} style={s.modalClose}>
                            <X size={20} color={C.text} />
                        </TouchableOpacity>
                    </View>
                    <View style={[s.searchBarWrap, { backgroundColor: C.surface, borderColor: C.border }]}>
                        <Search size={16} color={C.muted} style={{ marginLeft: 10 }} />
                        <TextInput
                            style={[s.searchBarInput, { color: C.text }]}
                            placeholder="Search countries..."
                            placeholderTextColor={C.muted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery("")} style={{ marginRight: 10 }}>
                                <X size={16} color={C.muted} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
                        {filteredCountries.map((c) => (
                            <TouchableOpacity
                                key={c.label}
                                style={[s.countryItem, { borderBottomColor: C.border }, country === c.label && s.countryItemActive]}
                                onPress={() => {
                                    handleSelectCountry(c.label);
                                    setShowCountryModal(false);
                                    setSearchQuery("");
                                }}
                            >
                                <Text style={[s.countryText, { color: C.text }]}>{c.display}</Text>
                                {country === c.label && <Check size={18} color={GOLD} />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modal>`;

const newScrollViewAndForm = '                <ScrollView\n' +
'                    ref={scrollRef}\n' +
'                    scrollEnabled={!pkgExpanded}\n' +
'                    showsVerticalScrollIndicator={false}\n' +
'                    keyboardShouldPersistTaps="handled"\n' +
'                    keyboardDismissMode="on-drag"\n' +
'                    contentContainerStyle={{ paddingBottom: 40 }}\n' +
'                >\n' +
'                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>\n' +
'                        <ChevronLeft size={22} color={C.text} />\n' +
'                        <Text style={[s.backText, { color: C.text }]}>Back</Text>\n' +
'                    </TouchableOpacity>\n' +
'\n' +
'                    <Text style={[s.title, { color: C.text }]}>Diaspora Support</Text>\n' +
'                    <Text style={[s.subtitle, { color: C.muted }]}>Remote assistance for Nigerians abroad</Text>\n' +
'\n' +
'                    {/* Country of Residence Selection (Directly at the Top in Square Grid) */}\n' +
'                    <View style={s.section}>\n' +
'                        <Text style={[s.label, { color: C.text }]}>Country of Residence *</Text>\n' +
'                        <Text style={[s.sectionDesc, { color: C.muted }]}>Where are you requesting this service from?</Text>\n' +
'                        <View style={s.countryGrid}>\n' +
'                            {IMPORTANT_COUNTRIES.map((c) => {\n' +
'                                const isSelected = country === c.label && !isOtherSelected;\n' +
'                                return (\n' +
'                                    <TouchableOpacity\n' +
'                                        key={c.label}\n' +
'                                        style={[s.countryCard, isSelected && s.countryCardActive]}\n' +
'                                        onPress={() => handleSelectCountry(c.label)}\n' +
'                                        activeOpacity={0.8}\n' +
'                                    >\n' +
'                                        <Text style={s.countryCardFlag}>{c.flag}</Text>\n' +
'                                        <Text numberOfLines={1} adjustsFontSizeToFit style={[s.countryCardName, { color: C.text }]}>{c.name}</Text>\n' +
'                                    </TouchableOpacity>\n' +
'                                );\n' +
'                            })}\n' +
'                            <TouchableOpacity\n' +
'                                style={[s.countryCard, isOtherSelected && s.countryCardActive]}\n' +
'                                onPress={handleSelectOther}\n' +
'                                activeOpacity={0.8}\n' +
'                            >\n' +
'                                <Text style={s.countryCardFlag}>{isOtherSelected && otherCountry ? getFlagEmoji(otherCountry) : "🌍"}</Text>\n' +
'                                <Text numberOfLines={1} adjustsFontSizeToFit style={[s.countryCardName, { color: C.text }]}>\n' +
'                                    {isOtherSelected && otherCountry ? otherCountry : "Other"}\n' +
'                                </Text>\n' +
'                            </TouchableOpacity>\n' +
'                        </View>\n' +
'\n' +
'                        {/* Inline Specify Country Input */}\n' +
'                        {isOtherSelected && (\n' +
'                            <View style={{ marginTop: 14 }}>\n' +
'                                <Text style={[s.label, { color: C.text, fontSize: 11 }]}>Specify Country *</Text>\n' +
'                                <TextInput\n' +
'                                    style={[s.singleLineInput, { color: C.text, backgroundColor: C.surface, borderColor: showError && !otherCountry.trim() ? "#ef5350" : C.border }]}\n' +
'                                    placeholder="e.g. Australia, South Africa, UAE..."\n' +
'                                    placeholderTextColor={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"}\n' +
'                                    value={otherCountry}\n' +
'                                    onChangeText={setOtherCountry}\n' +
'                                    returnKeyType="done"\n' +
'                                    onSubmitEditing={() => Keyboard.dismiss()}\n' +
'                                />\n' +
'                                {showError && !otherCountry.trim() && (\n' +
'                                    <Text style={{ color: "#ef5350", fontSize: 12, marginTop: 4 }}>Base country is required.</Text>\n' +
'                                )}\n' +
'                                \n' +
'                                {/* Suggestions */}\n' +
'                                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>\n' +
'                                    {SUGGESTIONS.map(sugg => {\n' +
'                                        const isSuggSelected = otherCountry.toLowerCase() === sugg.label.toLowerCase();\n' +
'                                        return (\n' +
'                                            <TouchableOpacity\n' +
'                                                key={sugg.label}\n' +
'                                                style={[\n' +
'                                                    s.suggestionChip,\n' +
'                                                    {\n' +
'                                                        borderColor: isSuggSelected ? GOLD : C.border,\n' +
'                                                        backgroundColor: isSuggSelected ? `${GOLD}15` : C.surface\n' +
'                                                    }\n' +
'                                                ]}\n' +
'                                                onPress={() => setOtherCountry(sugg.label)}\n' +
'                                                activeOpacity={0.7}\n' +
'                                            >\n' +
'                                                <Text style={[s.suggestionChipText, { color: isSuggSelected ? GOLD : C.muted }]}>\n' +
'                                                    {sugg.display}\n' +
'                                                </Text>\n' +
'                                            </TouchableOpacity>\n' +
'                                        );\n' +
'                                    })}\n' +
'                                </View>\n' +
'                            </View>\n' +
'                        )}\n' +
'                    </View>\n' +
'\n' +
'                    {/* Package Selection */}\n' +
'                    <View style={s.section}>\n' +
'                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>\n' +
'                            <Text style={[s.label, { color: C.text, marginBottom: 0 }]}>Select Package *</Text>\n' +
'                            {pkgExpanded && (\n' +
'                                <TouchableOpacity onPress={() => setPkgExpanded(false)} style={{ padding: 4 }}>\n' +
'                                    <ChevronUp size={20} color={GOLD} />\n' +
'                                </TouchableOpacity>\n' +
'                            )}\n' +
'                        </View>\n' +
'                        {!pkgExpanded ? (\n' +
'                            /* Collapsed state: Render only selected package with a ChevronDown arrow */\n' +
'                            <View>\n' +
'                                {(() => {\n' +
'                                    const selectedPkg = PACKAGES.find(p => p.id === serviceType) || PACKAGES[0];\n' +
'                                    const IconComponent = selectedPkg.Icon;\n' +
'                                    return (\n' +
'                                        <TouchableOpacity\n' +
'                                            style={[s.packageCard, s.packageCardActive]}\n' +
'                                            onPress={() => setPkgExpanded(true)}\n' +
'                                            activeOpacity={0.8}\n' +
'                                        >\n' +
'                                            <View style={s.packageHeader}>\n' +
'                                                <View style={[s.packageIconWrap, s.packageIconWrapActive]}>\n' +
'                                                    <IconComponent size={18} color={GOLD} />\n' +
'                                                </View>\n' +
'                                                <Text style={[s.packageLabel, { color: C.text, flex: 1 }]}>{selectedPkg.label}</Text>\n' +
'                                                <ChevronDown size={20} color={GOLD} />\n' +
'                                            </View>\n' +
'                                            <Text style={[s.packageDesc, { color: C.muted }]}>{selectedPkg.desc}</Text>\n' +
'                                            <Text style={s.packageBullet}>• {selectedPkg.bullet}</Text>\n' +
'                                        </TouchableOpacity>\n' +
'                                    );\n' +
'                                })()}\n' +
'                            </View>\n' +
'                        ) : (\n' +
'                            /* Expanded state: Render list of all packages */\n' +
'                            <View style={s.packageList}>\n' +
'                                {PACKAGES.map((pkg) => {\n' +
'                                    const isSelected = serviceType === pkg.id;\n' +
'                                    const IconComponent = pkg.Icon;\n' +
'                                    return (\n' +
'                                        <TouchableOpacity\n' +
'                                            key={pkg.id}\n' +
'                                            style={[s.packageCard, isSelected && s.packageCardActive]}\n' +
'                                            onPress={() => {\n' +
'                                                setServiceType(pkg.id);\n' +
'                                                setPkgExpanded(false);\n' +
'                                            }}\n' +
'                                            activeOpacity={0.8}\n' +
'                                        >\n' +
'                                            <View style={s.packageHeader}>\n' +
'                                                <View style={[s.packageIconWrap, isSelected && s.packageIconWrapActive]}>\n' +
'                                                    <IconComponent size={18} color={isSelected ? GOLD : C.text} />\n' +
'                                                </View>\n' +
'                                                <Text style={[s.packageLabel, { color: C.text, flex: 1 }]}>{pkg.label}</Text>\n' +
'                                                {isSelected && <Check size={16} color={GOLD} />}\n' +
'                                            </View>\n' +
'                                            <Text style={[s.packageDesc, { color: C.muted }]}>{pkg.desc}</Text>\n' +
'                                            <Text style={s.packageBullet}>• {pkg.bullet}</Text>\n' +
'                                        </TouchableOpacity>\n' +
'                                    );\n' +
'                                })}\n' +
'                            </View>\n' +
'                        )}\n' +
'                    </View>\n' +
'\n' +
'                    {/* Estimated Budget Stepper */}\n' +
'                    <View style={s.section}>\n' +
'                        <Text style={[s.label, { color: C.text }]}>Estimated Budget *</Text>\n' +
'                        <BudgetStepper\n' +
'                            value={budgetAmount}\n' +
'                            onChange={setBudgetAmount}\n' +
'                            min={250000} // Minimum ₦250k\n' +
'                            step={250000} // Increment by ₦250k\n' +
'                            label="Estimated Service Budget"\n' +
'                            C={C}\n' +
'                            theme={theme}\n' +
'                        />\n' +
'                    </View>\n' +
'\n' +
'                    {/* Timeline */}\n' +
'                    <View style={s.section}>\n' +
'                        <Text style={[s.label, { color: C.text }]}>Timeline</Text>\n' +
'                        <TextInput\n' +
'                            style={[s.input, { color: C.text }]}\n' +
'                            placeholder="e.g. Within 2 weeks"\n' +
'                            placeholderTextColor={C.muted}\n' +
'                            value={timeline}\n' +
'                            onChangeText={setTimeline}\n' +
'                            returnKeyType="done"\n' +
'                            onSubmitEditing={() => Keyboard.dismiss()}\n' +
'                        />\n' +
'                    </View>\n' +
'\n' +
'                    {/* Details input with VoiceInput */}\n' +
'                    <View style={s.section}>\n' +
'                        <Text style={[s.label, { color: C.text }]} onLayout={e => { detailsY.current = e.nativeEvent.layout.y; }}>\n' +
'                            Details *\n' +
'                        </Text>\n' +
'                        <VoiceInput\n' +
'                            placeholder="Describe what you need help with in detail..."\n' +
'                            value={details}\n' +
'                            onChange={setDetails}\n' +
'                            accent={GOLD}\n' +
'                            textColor={C.text}\n' +
'                            border={showError && !details ? "#ef5350" : C.border}\n' +
'                            inputBg={C.surface}\n' +
'                        />\n' +
'                    </View>\n' +
'\n' +
'                    {showError && (!country || (isOtherSelected && !otherCountry.trim()) || !details) && (\n' +
'                        <Text style={s.errorText}>Please fill in all required fields.</Text>\n' +
'                    )}\n' +
'\n' +
'                    <TouchableOpacity\n' +
'                        style={[s.btn, loading && s.btnDisabled]}\n' +
'                        onPress={handleSubmit}\n' +
'                        disabled={loading}\n' +
'                        activeOpacity={0.85}\n' +
'                    >\n' +
'                        <Text style={[s.btnText, { color: C.background }]}>\n' +
'                            {loading ? "Submitting..." : "Submit Request"}\n' +
'                        </Text>\n' +
'                    </TouchableOpacity>\n' +
'                </ScrollView>\n' +
'            </KeyboardAvoidingView>';

if (!content.includes(oldScrollViewAndForm)) {
    console.error("Error: oldScrollViewAndForm target not found in diaspora-support.tsx!");
    process.exit(1);
}
content = content.replace(oldScrollViewAndForm, newScrollViewAndForm);

// 5. Replace StyleSheet styles returned by getStyles
const oldStylesSection = `        root: { flex: 1, backgroundColor: C.background, paddingHorizontal: 20 },
        backBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 16, gap: 4 },
        backText: { fontSize: 14, fontWeight: "500" },
        title: { fontSize: 24, fontWeight: "700", marginBottom: 4, fontFamily: "PlayfairDisplay_700Bold" },
        subtitle: { fontSize: 13, marginBottom: 28 },
        section: { marginBottom: 24 },
        sectionDesc: { fontSize: 12, marginBottom: 12 },
        label: { fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
        input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, fontSize: 14, marginBottom: 18 },
        inputError: { borderColor: "#ef5350" },
        errorText: { fontSize: 13, color: "#ef5350", marginBottom: 12, textAlign: "center" },
        btn: { backgroundColor: C.primary, borderRadius: 14, padding: 16, alignItems: "center", marginTop: 8 },
        btnDisabled: { opacity: 0.6 },
        btnText: { fontSize: 15, fontWeight: "700" },

        // Square country cards layout styling`;

const newStylesSection = `        root: { flex: 1, backgroundColor: C.background, paddingHorizontal: 20 },
        backBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 16, gap: 4 },
        backText: { fontSize: 14, fontWeight: "500" },
        title: { fontSize: 24, fontWeight: "700", marginBottom: 4, fontFamily: "PlayfairDisplay_700Bold" },
        subtitle: { fontSize: 13, marginBottom: 28 },
        section: { marginBottom: 24 },
        sectionDesc: { fontSize: 12, marginBottom: 12 },
        label: { fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
        input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, fontSize: 14, marginBottom: 18 },
        inputError: { borderColor: "#ef5350" },
        errorText: { fontSize: 13, color: "#ef5350", marginBottom: 12, textAlign: "center" },
        btn: { backgroundColor: C.primary, borderRadius: 14, padding: 16, alignItems: "center", marginTop: 8 },
        btnDisabled: { opacity: 0.6 },
        btnText: { fontSize: 15, fontWeight: "700" },

        // Specify country input styles
        singleLineInput: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, fontSize: 14, marginTop: 6 },
        suggestionChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
        suggestionChipText: { fontSize: 12, fontWeight: "600" },

        // Square country cards layout styling`;

if (!content.includes(oldStylesSection)) {
    console.error("Error: oldStylesSection target not found in diaspora-support.tsx!");
    process.exit(1);
}
content = content.replace(oldStylesSection, newStylesSection);

fs.writeFileSync(targetPath, content, 'utf8');
console.log("Success: applied all replacements to diaspora-support.tsx successfully!");
