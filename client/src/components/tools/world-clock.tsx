import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Clock } from "lucide-react";

type TimeZone = {
  id: string;
  name: string;
  timezone: string;
  country: string;
  offset: string;
};

const popularTimeZones = [
  { id: "utc", name: "UTC", timezone: "UTC", country: "Universal", offset: "+00:00" },
  { id: "new-york", name: "New York", timezone: "America/New_York", country: "USA", offset: "-05:00" },
  { id: "los-angeles", name: "Los Angeles", timezone: "America/Los_Angeles", country: "USA", offset: "-08:00" },
  { id: "chicago", name: "Chicago", timezone: "America/Chicago", country: "USA", offset: "-06:00" },
  { id: "london", name: "London", timezone: "Europe/London", country: "UK", offset: "+00:00" },
  { id: "paris", name: "Paris", timezone: "Europe/Paris", country: "France", offset: "+01:00" },
  { id: "berlin", name: "Berlin", timezone: "Europe/Berlin", country: "Germany", offset: "+01:00" },
  { id: "moscow", name: "Moscow", timezone: "Europe/Moscow", country: "Russia", offset: "+03:00" },
  { id: "dubai", name: "Dubai", timezone: "Asia/Dubai", country: "UAE", offset: "+04:00" },
  { id: "mumbai", name: "Mumbai", timezone: "Asia/Kolkata", country: "India", offset: "+05:30" },
  { id: "singapore", name: "Singapore", timezone: "Asia/Singapore", country: "Singapore", offset: "+08:00" },
  { id: "hong-kong", name: "Hong Kong", timezone: "Asia/Hong_Kong", country: "Hong Kong", offset: "+08:00" },
  { id: "tokyo", name: "Tokyo", timezone: "Asia/Tokyo", country: "Japan", offset: "+09:00" },
  { id: "sydney", name: "Sydney", timezone: "Australia/Sydney", country: "Australia", offset: "+11:00" },
  { id: "auckland", name: "Auckland", timezone: "Pacific/Auckland", country: "New Zealand", offset: "+13:00" },
];

export default function WorldClockTool() {
  const [selectedTimeZones, setSelectedTimeZones] = useState<TimeZone[]>([
    popularTimeZones[0], // UTC
    popularTimeZones[1], // New York
    popularTimeZones[10], // Singapore
    popularTimeZones[12], // Tokyo
  ]);
  const [currentTimes, setCurrentTimes] = useState<{ [key: string]: Date }>({});
  const [selectedTimeZone, setSelectedTimeZone] = useState("");

  useEffect(() => {
    const updateTimes = () => {
      const times: { [key: string]: Date } = {};
      selectedTimeZones.forEach(tz => {
        times[tz.id] = new Date();
      });
      setCurrentTimes(times);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);

    return () => clearInterval(interval);
  }, [selectedTimeZones]);

  const addTimeZone = () => {
    if (!selectedTimeZone) return;
    
    const timeZone = popularTimeZones.find(tz => tz.id === selectedTimeZone);
    if (timeZone && !selectedTimeZones.find(tz => tz.id === timeZone.id)) {
      setSelectedTimeZones([...selectedTimeZones, timeZone]);
    }
    setSelectedTimeZone("");
  };

  const removeTimeZone = (id: string) => {
    setSelectedTimeZones(selectedTimeZones.filter(tz => tz.id !== id));
  };

  const formatTime = (date: Date, timezone: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(date);
    } catch {
      return "Invalid timezone";
    }
  };

  const formatDate = (date: Date, timezone: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch {
      return "Invalid timezone";
    }
  };

  const getTimeOfDay = (date: Date, timezone: string) => {
    try {
      const hour = parseInt(new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        hour12: false,
      }).format(date));

      if (hour >= 6 && hour < 12) return { period: "Morning", emoji: "🌅", color: "bg-yellow-100 text-yellow-800" };
      if (hour >= 12 && hour < 17) return { period: "Afternoon", emoji: "☀️", color: "bg-orange-100 text-orange-800" };
      if (hour >= 17 && hour < 20) return { period: "Evening", emoji: "🌆", color: "bg-purple-100 text-purple-800" };
      return { period: "Night", emoji: "🌙", color: "bg-blue-100 text-blue-800" };
    } catch {
      return { period: "Unknown", emoji: "❓", color: "bg-gray-100 text-gray-800" };
    }
  };

  const availableTimeZones = popularTimeZones.filter(
    tz => !selectedTimeZones.find(selected => selected.id === tz.id)
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">World Clock</h2>
          <p className="text-slate-600">Track multiple time zones for global communication</p>
        </div>
      </div>

      {/* Add Time Zone */}
      <Card>
        <CardHeader>
          <CardTitle>Add Time Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Select value={selectedTimeZone} onValueChange={setSelectedTimeZone}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a time zone to add..." />
              </SelectTrigger>
              <SelectContent>
                {availableTimeZones.map(tz => (
                  <SelectItem key={tz.id} value={tz.id}>
                    {tz.name}, {tz.country} ({tz.offset})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={addTimeZone} disabled={!selectedTimeZone}>
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Time Zone Grid */}
      {selectedTimeZones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <div className="text-slate-400 mb-4">
              No time zones added yet. Add some time zones to get started!
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedTimeZones.map((tz) => {
            const currentTime = currentTimes[tz.id];
            const timeOfDay = getTimeOfDay(currentTime, tz.timezone);
            
            return (
              <Card key={tz.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{tz.name}</CardTitle>
                      <p className="text-sm text-slate-600">{tz.country}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={timeOfDay.color}>
                        {timeOfDay.emoji} {timeOfDay.period}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTimeZone(tz.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-3xl font-mono text-slate-900 mb-1">
                        {currentTime ? formatTime(currentTime, tz.timezone) : "--:--:--"}
                      </div>
                      <div className="text-sm text-slate-600">
                        {currentTime ? formatDate(currentTime, tz.timezone) : "Loading..."}
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>UTC {tz.offset}</span>
                      <span>{tz.timezone}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Time Zone Comparison */}
      {selectedTimeZones.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Time Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Location</th>
                    <th className="text-left p-2">Current Time</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">UTC Offset</th>
                    <th className="text-left p-2">Period</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTimeZones.map((tz) => {
                    const currentTime = currentTimes[tz.id];
                    const timeOfDay = getTimeOfDay(currentTime, tz.timezone);
                    
                    return (
                      <tr key={tz.id} className="border-b">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{tz.name}</div>
                            <div className="text-sm text-slate-600">{tz.country}</div>
                          </div>
                        </td>
                        <td className="p-2 font-mono text-lg">
                          {currentTime ? formatTime(currentTime, tz.timezone) : "--:--:--"}
                        </td>
                        <td className="p-2 text-sm">
                          {currentTime ? new Intl.DateTimeFormat('en-US', {
                            timeZone: tz.timezone,
                            month: 'short',
                            day: 'numeric',
                          }).format(currentTime) : "---"}
                        </td>
                        <td className="p-2 text-sm">UTC {tz.offset}</td>
                        <td className="p-2">
                          <Badge variant="outline" className={timeOfDay.color}>
                            {timeOfDay.emoji} {timeOfDay.period}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
