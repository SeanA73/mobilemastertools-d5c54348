import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowUpDown, 
  Copy, 
  Star, 
  StarOff, 
  History, 
  Trash2, 
  Settings,
  Search,
  Calculator,
  TrendingUp,
  Zap,
  Thermometer,
  Ruler,
  Weight,
  Clock,
  HardDrive,
  Gauge,
  Activity,
  Circle,
  Radio,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ConversionCategory = 
  | "length" 
  | "weight" 
  | "temperature" 
  | "volume" 
  | "area" 
  | "speed"
  | "time"
  | "data"
  | "energy"
  | "pressure"
  | "power"
  | "angle"
  | "frequency";

type Unit = {
  name: string;
  symbol: string;
  toBase: number;
  fromBase: number;
  description?: string;
};

type ConversionHistory = {
  id: string;
  timestamp: Date;
  category: ConversionCategory;
  fromUnit: string;
  toUnit: string;
  inputValue: string;
  result: string;
};

type FavoriteConversion = {
  id: string;
  category: ConversionCategory;
  fromUnit: string;
  toUnit: string;
  label: string;
};

const categoryIcons = {
  length: Ruler,
  weight: Weight,
  temperature: Thermometer,
  volume: Activity,
  area: TrendingUp,
  speed: Zap,
  time: Clock,
  data: HardDrive,
  energy: Zap,
  pressure: Gauge,
  power: Activity,
  angle: Circle,
  frequency: Radio,
};

const conversionData: Record<ConversionCategory, { baseUnit: string; units: Unit[] }> = {
  length: {
    baseUnit: "meter",
    units: [
      { name: "Nanometer", symbol: "nm", toBase: 0.000000001, fromBase: 1000000000, description: "Used in wavelengths" },
      { name: "Micrometer", symbol: "μm", toBase: 0.000001, fromBase: 1000000, description: "Used in microscopy" },
      { name: "Millimeter", symbol: "mm", toBase: 0.001, fromBase: 1000, description: "Common small measurements" },
      { name: "Centimeter", symbol: "cm", toBase: 0.01, fromBase: 100, description: "Everyday measurements" },
      { name: "Meter", symbol: "m", toBase: 1, fromBase: 1, description: "SI base unit" },
      { name: "Kilometer", symbol: "km", toBase: 1000, fromBase: 0.001, description: "Long distances" },
      { name: "Inch", symbol: "in", toBase: 0.0254, fromBase: 39.3701, description: "Imperial unit" },
      { name: "Foot", symbol: "ft", toBase: 0.3048, fromBase: 3.28084, description: "12 inches" },
      { name: "Yard", symbol: "yd", toBase: 0.9144, fromBase: 1.09361, description: "3 feet" },
      { name: "Mile", symbol: "mi", toBase: 1609.34, fromBase: 0.000621371, description: "5280 feet" },
      { name: "Nautical Mile", symbol: "nmi", toBase: 1852, fromBase: 0.000539957, description: "Maritime navigation" },
      { name: "Light Year", symbol: "ly", toBase: 9.461e15, fromBase: 1.057e-16, description: "Astronomical distances" },
    ],
  },
  weight: {
    baseUnit: "kilogram",
    units: [
      { name: "Microgram", symbol: "μg", toBase: 0.000000001, fromBase: 1000000000, description: "Very small masses" },
      { name: "Milligram", symbol: "mg", toBase: 0.000001, fromBase: 1000000, description: "Medicine dosages" },
      { name: "Gram", symbol: "g", toBase: 0.001, fromBase: 1000, description: "Common small items" },
      { name: "Kilogram", symbol: "kg", toBase: 1, fromBase: 1, description: "SI base unit" },
      { name: "Metric Ton", symbol: "t", toBase: 1000, fromBase: 0.001, description: "1000 kilograms" },
      { name: "Ounce", symbol: "oz", toBase: 0.0283495, fromBase: 35.274, description: "Imperial unit" },
      { name: "Pound", symbol: "lb", toBase: 0.453592, fromBase: 2.20462, description: "16 ounces" },
      { name: "Stone", symbol: "st", toBase: 6.35029, fromBase: 0.157473, description: "14 pounds" },
      { name: "US Ton", symbol: "US ton", toBase: 907.185, fromBase: 0.00110231, description: "2000 pounds" },
      { name: "Imperial Ton", symbol: "UK ton", toBase: 1016.05, fromBase: 0.000984207, description: "2240 pounds" },
    ],
  },
  temperature: {
    baseUnit: "celsius",
    units: [
      { name: "Celsius", symbol: "°C", toBase: 1, fromBase: 1, description: "Water freezes at 0°C" },
      { name: "Fahrenheit", symbol: "°F", toBase: 1, fromBase: 1, description: "Used in the US" },
      { name: "Kelvin", symbol: "K", toBase: 1, fromBase: 1, description: "Absolute temperature scale" },
      { name: "Rankine", symbol: "°R", toBase: 1, fromBase: 1, description: "Absolute Fahrenheit scale" },
    ],
  },
  volume: {
    baseUnit: "liter",
    units: [
      { name: "Milliliter", symbol: "ml", toBase: 0.001, fromBase: 1000, description: "1 cubic centimeter" },
      { name: "Centiliter", symbol: "cl", toBase: 0.01, fromBase: 100, description: "10 milliliters" },
      { name: "Deciliter", symbol: "dl", toBase: 0.1, fromBase: 10, description: "100 milliliters" },
      { name: "Liter", symbol: "l", toBase: 1, fromBase: 1, description: "SI unit" },
      { name: "Cubic Meter", symbol: "m³", toBase: 1000, fromBase: 0.001, description: "1000 liters" },
      { name: "Teaspoon", symbol: "tsp", toBase: 0.00492892, fromBase: 202.884, description: "US cooking" },
      { name: "Tablespoon", symbol: "tbsp", toBase: 0.0147868, fromBase: 67.628, description: "3 teaspoons" },
      { name: "Fluid Ounce", symbol: "fl oz", toBase: 0.0295735, fromBase: 33.814, description: "US fluid ounce" },
      { name: "Cup", symbol: "cup", toBase: 0.236588, fromBase: 4.22675, description: "8 fluid ounces" },
      { name: "Pint", symbol: "pt", toBase: 0.473176, fromBase: 2.11338, description: "2 cups" },
      { name: "Quart", symbol: "qt", toBase: 0.946353, fromBase: 1.05669, description: "2 pints" },
      { name: "Gallon (US)", symbol: "gal", toBase: 3.78541, fromBase: 0.264172, description: "4 quarts" },
      { name: "Gallon (UK)", symbol: "gal (UK)", toBase: 4.54609, fromBase: 0.219969, description: "Imperial gallon" },
    ],
  },
  area: {
    baseUnit: "square meter",
    units: [
      { name: "Square Millimeter", symbol: "mm²", toBase: 0.000001, fromBase: 1000000, description: "Very small areas" },
      { name: "Square Centimeter", symbol: "cm²", toBase: 0.0001, fromBase: 10000, description: "Small areas" },
      { name: "Square Meter", symbol: "m²", toBase: 1, fromBase: 1, description: "SI unit" },
      { name: "Hectare", symbol: "ha", toBase: 10000, fromBase: 0.0001, description: "10,000 m²" },
      { name: "Square Kilometer", symbol: "km²", toBase: 1000000, fromBase: 0.000001, description: "Large areas" },
      { name: "Square Inch", symbol: "in²", toBase: 0.00064516, fromBase: 1550, description: "Imperial unit" },
      { name: "Square Foot", symbol: "ft²", toBase: 0.092903, fromBase: 10.7639, description: "Common in real estate" },
      { name: "Square Yard", symbol: "yd²", toBase: 0.836127, fromBase: 1.19599, description: "9 square feet" },
      { name: "Acre", symbol: "ac", toBase: 4046.86, fromBase: 0.000247105, description: "43,560 sq ft" },
      { name: "Square Mile", symbol: "mi²", toBase: 2589988, fromBase: 3.861e-7, description: "640 acres" },
    ],
  },
  speed: {
    baseUnit: "meters per second",
    units: [
      { name: "Meters per Second", symbol: "m/s", toBase: 1, fromBase: 1, description: "SI unit" },
      { name: "Kilometers per Hour", symbol: "km/h", toBase: 0.277778, fromBase: 3.6, description: "Common speed unit" },
      { name: "Miles per Hour", symbol: "mph", toBase: 0.44704, fromBase: 2.23694, description: "US speed unit" },
      { name: "Feet per Second", symbol: "ft/s", toBase: 0.3048, fromBase: 3.28084, description: "Imperial unit" },
      { name: "Knots", symbol: "kt", toBase: 0.514444, fromBase: 1.94384, description: "Maritime/aviation" },
      { name: "Mach", symbol: "Ma", toBase: 343, fromBase: 0.00291545, description: "Speed of sound" },
    ],
  },
  time: {
    baseUnit: "second",
    units: [
      { name: "Nanosecond", symbol: "ns", toBase: 0.000000001, fromBase: 1000000000, description: "Computer timing" },
      { name: "Microsecond", symbol: "μs", toBase: 0.000001, fromBase: 1000000, description: "Scientific measurements" },
      { name: "Millisecond", symbol: "ms", toBase: 0.001, fromBase: 1000, description: "Common in computing" },
      { name: "Second", symbol: "s", toBase: 1, fromBase: 1, description: "SI base unit" },
      { name: "Minute", symbol: "min", toBase: 60, fromBase: 0.0166667, description: "60 seconds" },
      { name: "Hour", symbol: "h", toBase: 3600, fromBase: 0.000277778, description: "60 minutes" },
      { name: "Day", symbol: "d", toBase: 86400, fromBase: 0.0000115741, description: "24 hours" },
      { name: "Week", symbol: "wk", toBase: 604800, fromBase: 0.00000165344, description: "7 days" },
      { name: "Month", symbol: "mo", toBase: 2592000, fromBase: 3.8580247e-7, description: "~30 days" },
      { name: "Year", symbol: "yr", toBase: 31536000, fromBase: 3.171e-8, description: "365 days" },
    ],
  },
  data: {
    baseUnit: "byte",
    units: [
      { name: "Bit", symbol: "b", toBase: 0.125, fromBase: 8, description: "Basic unit of data" },
      { name: "Byte", symbol: "B", toBase: 1, fromBase: 1, description: "8 bits" },
      { name: "Kilobyte", symbol: "KB", toBase: 1024, fromBase: 0.0009765625, description: "1,024 bytes" },
      { name: "Megabyte", symbol: "MB", toBase: 1048576, fromBase: 9.537e-7, description: "1,024 KB" },
      { name: "Gigabyte", symbol: "GB", toBase: 1073741824, fromBase: 9.313e-10, description: "1,024 MB" },
      { name: "Terabyte", symbol: "TB", toBase: 1099511627776, fromBase: 9.095e-13, description: "1,024 GB" },
      { name: "Petabyte", symbol: "PB", toBase: 1125899906842624, fromBase: 8.882e-16, description: "1,024 TB" },
    ],
  },
  energy: {
    baseUnit: "joule",
    units: [
      { name: "Joule", symbol: "J", toBase: 1, fromBase: 1, description: "SI unit" },
      { name: "Kilojoule", symbol: "kJ", toBase: 1000, fromBase: 0.001, description: "1,000 joules" },
      { name: "Calorie", symbol: "cal", toBase: 4.184, fromBase: 0.239006, description: "Small calorie" },
      { name: "Kilocalorie", symbol: "kcal", toBase: 4184, fromBase: 0.000239006, description: "Food calorie" },
      { name: "Watt-hour", symbol: "Wh", toBase: 3600, fromBase: 0.000277778, description: "Energy over time" },
      { name: "Kilowatt-hour", symbol: "kWh", toBase: 3600000, fromBase: 2.778e-7, description: "Electrical energy" },
      { name: "Electronvolt", symbol: "eV", toBase: 1.602e-19, fromBase: 6.242e18, description: "Particle physics" },
      { name: "British Thermal Unit", symbol: "BTU", toBase: 1055.06, fromBase: 0.000947817, description: "Thermal energy" },
    ],
  },
  pressure: {
    baseUnit: "pascal",
    units: [
      { name: "Pascal", symbol: "Pa", toBase: 1, fromBase: 1, description: "SI unit" },
      { name: "Kilopascal", symbol: "kPa", toBase: 1000, fromBase: 0.001, description: "1,000 pascals" },
      { name: "Bar", symbol: "bar", toBase: 100000, fromBase: 0.00001, description: "Atmospheric pressure" },
      { name: "Atmosphere", symbol: "atm", toBase: 101325, fromBase: 0.00000986923, description: "Standard atmosphere" },
      { name: "PSI", symbol: "psi", toBase: 6894.76, fromBase: 0.000145038, description: "Pounds per sq inch" },
      { name: "Torr", symbol: "Torr", toBase: 133.322, fromBase: 0.00750062, description: "mmHg" },
      { name: "Millibar", symbol: "mbar", toBase: 100, fromBase: 0.01, description: "Weather reports" },
    ],
  },
  power: {
    baseUnit: "watt",
    units: [
      { name: "Watt", symbol: "W", toBase: 1, fromBase: 1, description: "SI unit" },
      { name: "Kilowatt", symbol: "kW", toBase: 1000, fromBase: 0.001, description: "1,000 watts" },
      { name: "Megawatt", symbol: "MW", toBase: 1000000, fromBase: 0.000001, description: "1,000 kW" },
      { name: "Horsepower", symbol: "hp", toBase: 745.7, fromBase: 0.00134102, description: "Mechanical power" },
      { name: "BTU/hour", symbol: "BTU/h", toBase: 0.293071, fromBase: 3.41214, description: "Thermal power" },
    ],
  },
  angle: {
    baseUnit: "degree",
    units: [
      { name: "Degree", symbol: "°", toBase: 1, fromBase: 1, description: "Common angle unit" },
      { name: "Radian", symbol: "rad", toBase: 57.2958, fromBase: 0.0174533, description: "SI unit" },
      { name: "Gradian", symbol: "grad", toBase: 0.9, fromBase: 1.11111, description: "Metric angle" },
      { name: "Minute of Arc", symbol: "'", toBase: 0.0166667, fromBase: 60, description: "1/60 degree" },
      { name: "Second of Arc", symbol: '"', toBase: 0.000277778, fromBase: 3600, description: "1/60 minute" },
      { name: "Turn", symbol: "turn", toBase: 360, fromBase: 0.00277778, description: "Full rotation" },
    ],
  },
  frequency: {
    baseUnit: "hertz",
    units: [
      { name: "Hertz", symbol: "Hz", toBase: 1, fromBase: 1, description: "SI unit" },
      { name: "Kilohertz", symbol: "kHz", toBase: 1000, fromBase: 0.001, description: "1,000 Hz" },
      { name: "Megahertz", symbol: "MHz", toBase: 1000000, fromBase: 0.000001, description: "Radio frequencies" },
      { name: "Gigahertz", symbol: "GHz", toBase: 1000000000, fromBase: 1e-9, description: "CPU frequencies" },
      { name: "RPM", symbol: "rpm", toBase: 0.0166667, fromBase: 60, description: "Revolutions per minute" },
    ],
  },
};

const presetValues: Record<ConversionCategory, Array<{ label: string; value: number; unit: string }>> = {
  length: [
    { label: "Average human height", value: 1.7, unit: "m" },
    { label: "Marathon distance", value: 42.195, unit: "km" },
    { label: "Football field", value: 100, unit: "yd" },
  ],
  weight: [
    { label: "Average adult", value: 70, unit: "kg" },
    { label: "Newborn baby", value: 3.5, unit: "kg" },
    { label: "Small car", value: 1200, unit: "kg" },
  ],
  temperature: [
    { label: "Water freezing", value: 0, unit: "°C" },
    { label: "Body temperature", value: 37, unit: "°C" },
    { label: "Water boiling", value: 100, unit: "°C" },
    { label: "Room temperature", value: 20, unit: "°C" },
  ],
  volume: [
    { label: "Can of soda", value: 355, unit: "ml" },
    { label: "Water bottle", value: 500, unit: "ml" },
    { label: "Gallon of milk", value: 1, unit: "gal" },
  ],
  area: [
    { label: "Tennis court", value: 260, unit: "m²" },
    { label: "Football field", value: 1.32, unit: "ac" },
    { label: "Basketball court", value: 420, unit: "m²" },
  ],
  speed: [
    { label: "Walking", value: 5, unit: "km/h" },
    { label: "Car highway", value: 100, unit: "km/h" },
    { label: "Speed of sound", value: 1, unit: "Ma" },
  ],
  time: [
    { label: "Blink of an eye", value: 300, unit: "ms" },
    { label: "Workday", value: 8, unit: "h" },
    { label: "Week", value: 1, unit: "wk" },
  ],
  data: [
    { label: "Photo (high res)", value: 5, unit: "MB" },
    { label: "Movie (HD)", value: 4, unit: "GB" },
    { label: "Song (MP3)", value: 3, unit: "MB" },
  ],
  energy: [
    { label: "Apple", value: 218, unit: "kJ" },
    { label: "Banana", value: 371, unit: "kJ" },
    { label: "Pizza slice", value: 1172, unit: "kJ" },
  ],
  pressure: [
    { label: "Sea level", value: 1, unit: "atm" },
    { label: "Tire pressure", value: 32, unit: "psi" },
    { label: "Vacuum", value: 0, unit: "Pa" },
  ],
  power: [
    { label: "LED bulb", value: 10, unit: "W" },
    { label: "Microwave", value: 1000, unit: "W" },
    { label: "Car engine", value: 150, unit: "hp" },
  ],
  angle: [
    { label: "Right angle", value: 90, unit: "°" },
    { label: "Straight line", value: 180, unit: "°" },
    { label: "Full circle", value: 360, unit: "°" },
  ],
  frequency: [
    { label: "AC power (US)", value: 60, unit: "Hz" },
    { label: "FM radio", value: 100, unit: "MHz" },
    { label: "WiFi", value: 2.4, unit: "GHz" },
  ],
};

export default function UnitConverterTool() {
  const [category, setCategory] = useState<ConversionCategory>("length");
  const [fromUnit, setFromUnit] = useState("");
  const [toUnit, setToUnit] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState("");
  const [precision, setPrecision] = useState(6);
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState<ConversionHistory[]>([]);
  const [favorites, setFavorites] = useState<FavoriteConversion[]>([]);
  const [showAllUnits, setShowAllUnits] = useState(false);
  const [activeTab, setActiveTab] = useState("converter");
  const { toast } = useToast();

  const currentUnits = conversionData[category].units;

  // Load history and favorites from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("unitConverterHistory");
    const savedFavorites = localStorage.getItem("unitConverterFavorites");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory).map((h: any) => ({
        ...h,
        timestamp: new Date(h.timestamp),
      })));
    }
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save history and favorites to localStorage
  useEffect(() => {
    localStorage.setItem("unitConverterHistory", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem("unitConverterFavorites", JSON.stringify(favorites));
  }, [favorites]);

  const convertTemperature = (value: number, from: string, to: string): number => {
    // Convert to Celsius first
    let celsius: number;
    switch (from) {
      case "°C":
        celsius = value;
        break;
      case "°F":
        celsius = (value - 32) * 5/9;
        break;
      case "K":
        celsius = value - 273.15;
        break;
      case "°R":
        celsius = (value - 491.67) * 5/9;
        break;
      default:
        celsius = value;
    }

    // Convert from Celsius to target
    switch (to) {
      case "°C":
        return celsius;
      case "°F":
        return celsius * 9/5 + 32;
      case "K":
        return celsius + 273.15;
      case "°R":
        return (celsius + 273.15) * 9/5;
      default:
        return celsius;
    }
  };

  const performConversion = (value: string = inputValue, from: string = fromUnit, to: string = toUnit): string => {
    if (!value || !from || !to) {
      return "";
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return "Invalid input";
    }

    if (category === "temperature") {
      const convertedValue = convertTemperature(numValue, from, to);
      return convertedValue.toFixed(precision).replace(/\.?0+$/, "");
    }

    const fromUnitData = currentUnits.find(unit => unit.symbol === from);
    const toUnitData = currentUnits.find(unit => unit.symbol === to);

    if (!fromUnitData || !toUnitData) {
      return "Unit not found";
    }

    // Convert to base unit, then to target unit
    const baseValue = numValue * fromUnitData.toBase;
    const convertedValue = baseValue * toUnitData.fromBase;

    return convertedValue.toFixed(precision).replace(/\.?0+$/, "");
  };

  const handleConvert = () => {
    const convertedResult = performConversion();
    setResult(convertedResult);

    // Add to history
    if (convertedResult && convertedResult !== "Invalid input" && convertedResult !== "Unit not found") {
      const historyItem: ConversionHistory = {
        id: Date.now().toString(),
        timestamp: new Date(),
        category,
        fromUnit,
        toUnit,
        inputValue,
        result: convertedResult,
      };
      setHistory(prev => [historyItem, ...prev].slice(0, 50)); // Keep last 50
    }
  };

  useEffect(() => {
    if (inputValue && fromUnit && toUnit) {
      const convertedResult = performConversion();
      setResult(convertedResult);
    }
  }, [inputValue, fromUnit, toUnit, precision]);

  const swapUnits = () => {
    const tempUnit = fromUnit;
    setFromUnit(toUnit);
    setToUnit(tempUnit);
    setInputValue(result);
    setResult(inputValue);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Value copied to clipboard",
    });
  };

  const isFavorite = (cat: ConversionCategory, from: string, to: string) => {
    return favorites.some(f => f.category === cat && f.fromUnit === from && f.toUnit === to);
  };

  const toggleFavorite = () => {
    if (!fromUnit || !toUnit) return;

    if (isFavorite(category, fromUnit, toUnit)) {
      setFavorites(prev => prev.filter(f => 
        !(f.category === category && f.fromUnit === fromUnit && f.toUnit === toUnit)
      ));
      toast({ title: "Removed from favorites" });
    } else {
      const newFavorite: FavoriteConversion = {
        id: Date.now().toString(),
        category,
        fromUnit,
        toUnit,
        label: `${fromUnit} to ${toUnit}`,
      };
      setFavorites(prev => [...prev, newFavorite]);
      toast({ title: "Added to favorites" });
    }
  };

  const applyPreset = (presetValue: number, presetUnit: string) => {
    setFromUnit(presetUnit);
    setInputValue(presetValue.toString());
    if (toUnit) {
      const convertedResult = performConversion(presetValue.toString(), presetUnit, toUnit);
      setResult(convertedResult);
    }
  };

  const getConversionFormula = () => {
    if (!fromUnit || !toUnit || category === "temperature") return null;

    const fromUnitData = currentUnits.find(unit => unit.symbol === fromUnit);
    const toUnitData = currentUnits.find(unit => unit.symbol === toUnit);

    if (!fromUnitData || !toUnitData) return null;

    const factor = (fromUnitData.toBase * toUnitData.fromBase).toPrecision(6);
    return `1 ${fromUnit} = ${factor} ${toUnit}`;
  };

  const convertToAllUnits = (value: string, from: string) => {
    if (!value || !from) return [];

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return [];

    return currentUnits.map(unit => ({
      unit: unit.symbol,
      name: unit.name,
      value: performConversion(value, from, unit.symbol),
      description: unit.description,
    }));
  };

  const filteredUnits = useMemo(() => {
    if (!searchQuery) return currentUnits;
    return currentUnits.filter(unit => 
      unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentUnits, searchQuery]);

  const categoryOptions = [
    { value: "length", label: "Length", icon: Ruler },
    { value: "weight", label: "Weight/Mass", icon: Weight },
    { value: "temperature", label: "Temperature", icon: Thermometer },
    { value: "volume", label: "Volume", icon: Activity },
    { value: "area", label: "Area", icon: TrendingUp },
    { value: "speed", label: "Speed", icon: Zap },
    { value: "time", label: "Time", icon: Clock },
    { value: "data", label: "Data Storage", icon: HardDrive },
    { value: "energy", label: "Energy", icon: Zap },
    { value: "pressure", label: "Pressure", icon: Gauge },
    { value: "power", label: "Power", icon: Activity },
    { value: "angle", label: "Angle", icon: Circle },
    { value: "frequency", label: "Frequency", icon: Radio },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Advanced Unit Converter</h2>
          <p className="text-slate-600">Convert between units with precision and ease</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="converter">
            <Calculator className="w-4 h-4 mr-2" />
            Converter
          </TabsTrigger>
          <TabsTrigger value="batch">
            <TrendingUp className="w-4 h-4 mr-2" />
            All Units
          </TabsTrigger>
          <TabsTrigger value="favorites">
            <Star className="w-4 h-4 mr-2" />
            Favorites ({favorites.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            History ({history.length})
          </TabsTrigger>
        </TabsList>

        {/* Main Converter Tab */}
        <TabsContent value="converter" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unit Conversion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Category Selection Grid */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Category
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {categoryOptions.map(option => {
                    const Icon = option.icon;
                    return (
                      <Button
                        key={option.value}
                        variant={category === option.value ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => {
                          setCategory(option.value as ConversionCategory);
                          setFromUnit("");
                          setToUnit("");
                          setInputValue("");
                          setResult("");
                          setSearchQuery("");
                        }}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Search Units */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search units..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Conversion Interface */}
              <div className="grid md:grid-cols-3 gap-4 items-end">
                {/* From Unit */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    From
                  </label>
                  <Select value={fromUnit} onValueChange={setFromUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredUnits.map(unit => (
                        <SelectItem key={unit.symbol} value={unit.symbol}>
                          <div className="flex flex-col">
                            <span>{unit.name} ({unit.symbol})</span>
                            {unit.description && (
                              <span className="text-xs text-slate-500">{unit.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="Enter value"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="pr-8"
                    />
                    {inputValue && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                        onClick={() => copyToClipboard(inputValue)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex flex-col gap-2 items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={swapUnits}
                    disabled={!fromUnit || !toUnit}
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFavorite}
                    disabled={!fromUnit || !toUnit}
                  >
                    {isFavorite(category, fromUnit, toUnit) ? (
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <StarOff className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* To Unit */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    To
                  </label>
                  <Select value={toUnit} onValueChange={setToUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredUnits.map(unit => (
                        <SelectItem key={unit.symbol} value={unit.symbol}>
                          <div className="flex flex-col">
                            <span>{unit.name} ({unit.symbol})</span>
                            {unit.description && (
                              <span className="text-xs text-slate-500">{unit.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <div className="p-3 bg-slate-100 rounded-md flex items-center justify-between">
                      <div className="text-lg font-mono font-semibold text-slate-900">
                        {result || "0"}
                      </div>
                      {result && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copyToClipboard(result)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversion Formula */}
              {getConversionFormula() && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md text-sm text-blue-900">
                  <Info className="w-4 h-4" />
                  <span className="font-mono">{getConversionFormula()}</span>
                </div>
              )}

              {/* Settings */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-md">
                <Settings className="w-4 h-4 text-slate-600" />
                <label className="text-sm font-medium text-slate-700">
                  Precision:
                </label>
                <Select 
                  value={precision.toString()} 
                  onValueChange={(val) => setPrecision(parseInt(val))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 4, 6, 8, 10].map(p => (
                      <SelectItem key={p} value={p.toString()}>
                        {p} decimals
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quick Presets */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Quick Presets
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {presetValues[category]?.map((preset, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset.value, preset.unit)}
                      className="justify-start text-left"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold">{preset.label}</span>
                        <span className="text-xs text-slate-500">
                          {preset.value} {preset.unit}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Units View Tab */}
        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Convert to All Units</CardTitle>
              <p className="text-sm text-slate-600">
                See how your value converts to all available units in the {category} category
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Select value={fromUnit} onValueChange={setFromUnit}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentUnits.map(unit => (
                      <SelectItem key={unit.symbol} value={unit.symbol}>
                        {unit.name} ({unit.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Enter value"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1"
                />
              </div>

              <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                <div className="space-y-2">
                  {convertToAllUnits(inputValue, fromUnit).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">
                          {item.name} ({item.unit})
                        </span>
                        {item.description && (
                          <span className="text-xs text-slate-500">{item.description}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-mono font-semibold text-slate-900">
                          {item.value}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(item.value)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Favorites Tab */}
        <TabsContent value="favorites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Favorite Conversions</CardTitle>
              <p className="text-sm text-slate-600">
                Quick access to your frequently used conversions
              </p>
            </CardHeader>
            <CardContent>
              {favorites.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No favorites yet</p>
                  <p className="text-sm">Star conversions to save them here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {favorites.map(fav => (
                    <div
                      key={fav.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <div>
                          <p className="font-semibold text-slate-900">
                            {fav.fromUnit} → {fav.toUnit}
                          </p>
                          <p className="text-sm text-slate-500 capitalize">{fav.category}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCategory(fav.category);
                            setFromUnit(fav.fromUnit);
                            setToUnit(fav.toUnit);
                            setActiveTab("converter");
                          }}
                        >
                          Use
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setFavorites(prev => prev.filter(f => f.id !== fav.id));
                            toast({ title: "Removed from favorites" });
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Conversion History</CardTitle>
                  <p className="text-sm text-slate-600">
                    Your recent conversions
                  </p>
                </div>
                {history.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHistory([]);
                      toast({ title: "History cleared" });
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No history yet</p>
                  <p className="text-sm">Your conversions will appear here</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] w-full">
                  <div className="space-y-2">
                    {history.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold capitalize text-slate-700">
                              {item.category}
                            </span>
                            <span className="text-xs text-slate-500">
                              {item.timestamp.toLocaleString()}
                            </span>
                          </div>
                          <div className="font-mono text-sm">
                            <span className="text-slate-900">{item.inputValue} {item.fromUnit}</span>
                            <ArrowUpDown className="inline w-3 h-3 mx-2" />
                            <span className="font-semibold text-slate-900">{item.result} {item.toUnit}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCategory(item.category);
                              setFromUnit(item.fromUnit);
                              setToUnit(item.toUnit);
                              setInputValue(item.inputValue);
                              setResult(item.result);
                              setActiveTab("converter");
                            }}
                          >
                            Reuse
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(`${item.inputValue} ${item.fromUnit} = ${item.result} ${item.toUnit}`)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
