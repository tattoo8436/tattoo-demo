import { Button, Card } from "antd";
import { useEffect, useState } from "react";
import OpenAI from "openai";

interface IAirport {
  name_translations: {
    en: string;
    [key: string]: string;
  };
  city_code: string;
  country_code: string;
  time_zone: string;
  code: string;
  iata_type: string;
  name: string;
  flightable: boolean;
}

const client = new OpenAI({
  apiKey: import.meta.env.VITE_AIRPORT_KEY,
  dangerouslyAllowBrowser: true,
});

// function sleep(ms: number) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

function App() {
  const [airports, setAirports] = useState<IAirport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (airports.length) {
      downloadJSON(airports, "airports_translated.json");
    }
  }, [airports]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/data/AirportData.json");
      const data: IAirport[] = await res.json();

      const size = 20;
      const loopCount = Math.ceil(data.length / size);
      const translatedData: IAirport[] = [];

      for (let i = 0; i < loopCount; i++) {
        const payload = data.slice(i * size, (i + 1) * size).map((item) => ({
          name_translations: item.name_translations,
        }));

        const resAIRaw = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Bạn là một trợ lý hữu ích." },
            {
              role: "user",
              content: `Tôi gửi 1 json stringify, cần bạn dịch và thêm vào name_translations 2 prop vi(Việt Nam) và ko(Hàn Quốc). Bạn phải trả lời chỉ là nội dung json đã stringify (bắt đầu bằng '['): ${JSON.stringify(
                payload
              )}`,
            },
          ],
        });

        const resAI: any[] = JSON.parse(
          resAIRaw.choices[0].message.content?.replaceAll("\n", "")?.slice(7, -3) ??
            "[]"
        );
        resAI.forEach((item, index) => {
          translatedData.push({
            ...data[i * size + index],
            name_translations: item.name_translations,
          });
        });
      }

      setAirports(translatedData);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const downloadJSON = (data: any, filename = "airports.json") => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: "50px" }}>
      <Card>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button type="primary" loading={loading} onClick={fetchData}>
            Translate
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default App;
