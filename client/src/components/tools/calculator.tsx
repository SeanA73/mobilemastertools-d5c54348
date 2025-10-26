import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

type CalculatorMode = "basic" | "scientific";

export default function CalculatorTool() {
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [mode, setMode] = useState<CalculatorMode>("basic");

  const clearDisplay = () => {
    setDisplay("0");
    setEquation("");
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const deleteLast = () => {
    if (display.length > 1 && display !== "0") {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const inputNumber = (num: string) => {
    if (display === "0" || display === "Error") {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const inputOperator = (op: string) => {
    if (display !== "Error") {
      const newEquation = equation + display + " " + op + " ";
      setEquation(newEquation);
      setDisplay("0");
    }
  };

  const inputFunction = (func: string) => {
    try {
      const num = parseFloat(display);
      let result: number;

      switch (func) {
        case "sin":
          result = Math.sin(num * Math.PI / 180);
          break;
        case "cos":
          result = Math.cos(num * Math.PI / 180);
          break;
        case "tan":
          result = Math.tan(num * Math.PI / 180);
          break;
        case "log":
          result = Math.log10(num);
          break;
        case "ln":
          result = Math.log(num);
          break;
        case "sqrt":
          result = Math.sqrt(num);
          break;
        case "square":
          result = num * num;
          break;
        case "1/x":
          result = 1 / num;
          break;
        default:
          return;
      }

      if (isNaN(result) || !isFinite(result)) {
        setDisplay("Error");
      } else {
        setDisplay(result.toString());
      }
    } catch {
      setDisplay("Error");
    }
  };

  const calculate = () => {
    try {
      const fullEquation = equation + display;
      if (fullEquation.trim() === display) return;

      // Replace display operators with JavaScript operators
      const jsEquation = fullEquation
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/\^/g, "**");

      const result = eval(jsEquation);
      
      if (isNaN(result) || !isFinite(result)) {
        setDisplay("Error");
      } else {
        const resultStr = result.toString();
        setDisplay(resultStr);
        setHistory([...history, `${fullEquation} = ${resultStr}`]);
      }
      setEquation("");
    } catch {
      setDisplay("Error");
      setEquation("");
    }
  };

  const inputDecimal = () => {
    if (!display.includes(".") && display !== "Error") {
      setDisplay(display + ".");
    }
  };

  const basicButtons = [
    { label: "C", onClick: clearDisplay, className: "bg-red-100 text-red-700 hover:bg-red-200" },
    { label: "⌫", onClick: deleteLast, className: "bg-gray-100 text-gray-700 hover:bg-gray-200" },
    { label: "÷", onClick: () => inputOperator("÷"), className: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
    { label: "×", onClick: () => inputOperator("×"), className: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
    
    { label: "7", onClick: () => inputNumber("7") },
    { label: "8", onClick: () => inputNumber("8") },
    { label: "9", onClick: () => inputNumber("9") },
    { label: "-", onClick: () => inputOperator("-"), className: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
    
    { label: "4", onClick: () => inputNumber("4") },
    { label: "5", onClick: () => inputNumber("5") },
    { label: "6", onClick: () => inputNumber("6") },
    { label: "+", onClick: () => inputOperator("+"), className: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
    
    { label: "1", onClick: () => inputNumber("1") },
    { label: "2", onClick: () => inputNumber("2") },
    { label: "3", onClick: () => inputNumber("3") },
    { label: "=", onClick: calculate, className: "bg-green-100 text-green-700 hover:bg-green-200 row-span-2" },
    
    { label: "0", onClick: () => inputNumber("0"), className: "col-span-2" },
    { label: ".", onClick: inputDecimal },
  ];

  const scientificButtons = [
    { label: "sin", onClick: () => inputFunction("sin") },
    { label: "cos", onClick: () => inputFunction("cos") },
    { label: "tan", onClick: () => inputFunction("tan") },
    { label: "log", onClick: () => inputFunction("log") },
    
    { label: "ln", onClick: () => inputFunction("ln") },
    { label: "√", onClick: () => inputFunction("sqrt") },
    { label: "x²", onClick: () => inputFunction("square") },
    { label: "1/x", onClick: () => inputFunction("1/x") },
    
    { label: "π", onClick: () => inputNumber(Math.PI.toString()) },
    { label: "e", onClick: () => inputNumber(Math.E.toString()) },
    { label: "(", onClick: () => inputOperator("(") },
    { label: ")", onClick: () => inputOperator(")") },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Calculator</h2>
          <p className="text-slate-600">Perform calculations with basic and scientific functions</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calculator */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Calculator</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant={mode === "basic" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMode("basic")}
                  >
                    Basic
                  </Button>
                  <Button
                    variant={mode === "scientific" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMode("scientific")}
                  >
                    Scientific
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Display */}
              <div className="mb-6">
                {equation && (
                  <div className="text-sm text-slate-500 mb-1 min-h-5">{equation}</div>
                )}
                <div className="bg-slate-100 p-4 rounded-lg text-right">
                  <div className="text-3xl font-mono text-slate-900 truncate">
                    {display}
                  </div>
                </div>
              </div>

              {/* Scientific Functions (if in scientific mode) */}
              {mode === "scientific" && (
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {scientificButtons.map((btn, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={btn.onClick}
                      className="h-10 text-sm bg-purple-50 text-purple-700 hover:bg-purple-100"
                    >
                      {btn.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Main Calculator Grid */}
              <div className="grid grid-cols-4 gap-2">
                {basicButtons.map((btn, index) => (
                  <Button
                    key={index}
                    onClick={btn.onClick}
                    className={`h-12 text-lg font-semibold ${btn.className || "bg-slate-50 text-slate-900 hover:bg-slate-100"}`}
                    variant="outline"
                    style={btn.label === "=" ? { gridRow: "span 2" } : btn.label === "0" ? { gridColumn: "span 2" } : {}}
                  >
                    {btn.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <span>History</span>
                  <Badge variant="secondary">{history.length}</Badge>
                </CardTitle>
                {history.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No calculations yet
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {history.slice().reverse().map((calc, index) => (
                    <div
                      key={index}
                      className="p-2 bg-slate-50 rounded text-sm font-mono cursor-pointer hover:bg-slate-100"
                      onClick={() => {
                        const result = calc.split(" = ")[1];
                        setDisplay(result);
                      }}
                    >
                      {calc}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
