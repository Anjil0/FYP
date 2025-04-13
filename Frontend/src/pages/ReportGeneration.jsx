// ReportGeneration.js
import { useState } from "react";
import {
  Calendar,
  Download,
  FileText,
  Users,
  Book,
  DollarSign,
  Activity,
  Loader,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import Sidebar from "../components/AdminSidebar";
import baseUrl from "../config/config";

const ReportGeneration = () => {
  const [selectedSection, setSelectedSection] = useState("reports");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportPreview, setReportPreview] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: getDefaultFromDate(),
    to: formatDateForInput(new Date()),
  });

  const [formData, setFormData] = useState({
    reportType: "users",
    dateRange: "monthly",
    format: "excel", // Default to excel format only
    includeCharts: true,
    customDateRange: false,
  });

  // Available report types
  const reportTypes = [
    {
      id: "users",
      label: "User Statistics",
      icon: <Users className="h-5 w-5" />,
    },
    {
      id: "bookings",
      label: "Booking Reports",
      icon: <Book className="h-5 w-5" />,
    },
    {
      id: "payments",
      label: "Payment & Revenue",
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      id: "comprehensive",
      label: "Comprehensive Report",
      icon: <FileText className="h-5 w-5" />,
    },
  ];

  // Date range options
  const dateRangeOptions = [
    { id: "daily", label: "Daily (Last 24 hours)" },
    { id: "weekly", label: "Weekly (Last 7 days)" },
    { id: "monthly", label: "Monthly (Last 30 days)" },
    { id: "quarterly", label: "Quarterly (Last 3 months)" },
    { id: "yearly", label: "Yearly (Last 12 months)" },
    { id: "custom", label: "Custom Date Range" },
  ];

  // Color configurations for charts
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
  ];

  // Get default from date (30 days ago)
  function getDefaultFromDate() {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return formatDateForInput(date);
  }

  // Format date for input field
  function formatDateForInput(date) {
    const d = new Date(date);
    let month = "" + (d.getMonth() + 1);
    let day = "" + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  }

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));

      // If date range is changed to custom, update customDateRange
      if (name === "dateRange" && value === "custom") {
        setFormData((prev) => ({ ...prev, customDateRange: true }));
      } else if (name === "dateRange" && value !== "custom") {
        setFormData((prev) => ({ ...prev, customDateRange: false }));
      }
    }
  };

  // Handle date range changes
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
  };

  // Generate report preview
  const handlePreviewReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = {
        reportType: formData.reportType,
        dateRange: formData.dateRange,
        includeCharts: formData.includeCharts,
        from: formData.customDateRange ? dateRange.from : null,
        to: formData.customDateRange ? dateRange.to : null,
      };

      const response = await axios.get(`${baseUrl}/api/users/reports/preview`, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      setReportPreview(response.data);
    } catch (error) {
      console.error("Error previewing report:", error);
      setError(
        error.response?.data?.message || "Failed to generate report preview"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Download report
  const handleDownloadReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = {
        reportType: formData.reportType,
        dateRange: formData.dateRange,
        format: "excel", // Always use Excel format
        includeCharts: formData.includeCharts,
        from: formData.customDateRange ? dateRange.from : null,
        to: formData.customDateRange ? dateRange.to : null,
      };

      const response = await axios.get(
        `${baseUrl}/api/users/reports/download`,
        {
          params,
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Set file name and extension
      const fileName = `${formData.reportType}_report_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading report:", error);
      setError(error.response?.data?.message || "Failed to download report");
    } finally {
      setIsLoading(false);
    }
  };

  // Select report type card
  const ReportTypeCard = ({ type, selected, onSelect }) => (
    <div
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        selected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-blue-300"
      }`}
      onClick={() => onSelect(type.id)}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-full ${
            selected ? "bg-blue-100" : "bg-gray-100"
          }`}
        >
          {type.icon}
        </div>
        <span
          className={`font-medium ${
            selected ? "text-blue-700" : "text-gray-700"
          }`}
        >
          {type.label}
        </span>
      </div>
    </div>
  );

  // Render the appropriate chart based on type
  const renderChart = (chart) => {
    switch (chart.type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value) => [value, chart.title]} />
              <Legend />
              <Bar dataKey="value" fill="#0088FE" name={chart.title} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value) => [value, chart.title]} />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
                name={chart.title}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "pie":
        // Calculate total for percentage calculation
        const total = chart.data.reduce((sum, entry) => sum + entry.value, 0);

        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="label"
                // Don't show custom label on the chart itself - rely on legend instead
                label={false}
                labelLine={false}
              >
                {chart.data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [
                  `${value} (${((value / total) * 100).toFixed(0)}%)`,
                  name,
                ]}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                formatter={(value, entry) => {
                  // Format the legend text with percentages
                  const { payload } = entry;
                  const percent = ((payload.value / total) * 100).toFixed(0);
                  return `${value}: ${percent}%`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Chart type not supported</div>
          </div>
        );
    }
  };
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center p-6">
            <h1 className="text-2xl font-bold">Report Generation</h1>
          </div>
        </header>

        {/* Report Generation Form */}
        <div className="p-6">
          <div className="bg-white rounded-xl shadow-lg mb-6">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold flex items-center">
                <FileText className="h-5 w-5 text-blue-500 mr-2" />
                Generate Excel Reports
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Select report parameters to generate detailed Excel reports with
                charts and tables
              </p>
            </div>

            <div className="p-6">
              {/* Report Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {reportTypes.map((type) => (
                    <ReportTypeCard
                      key={type.id}
                      type={type}
                      selected={formData.reportType === type.id}
                      onSelect={(id) =>
                        setFormData((prev) => ({ ...prev, reportType: id }))
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Date Range Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <select
                      name="dateRange"
                      value={formData.dateRange}
                      onChange={handleChange}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {dateRangeOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.customDateRange && (
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">
                          From
                        </label>
                        <input
                          type="date"
                          name="from"
                          value={dateRange.from}
                          onChange={handleDateChange}
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">
                          To
                        </label>
                        <input
                          type="date"
                          name="to"
                          value={dateRange.to}
                          onChange={handleDateChange}
                          max={formatDateForInput(new Date())}
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Report Options */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Options
                </label>
                <div className="p-3 border rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="includeCharts"
                      checked={formData.includeCharts}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span>
                      Include visual charts and graphs in Excel report
                    </span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={handlePreviewReport}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  <span>Preview Report</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadReport}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>Download Excel Report</span>
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Report Preview */}
          {reportPreview && (
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold flex items-center">
                    <FileText className="h-5 w-5 text-blue-500 mr-2" />
                    Report Preview
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Preview of your generated report
                  </p>
                </div>
                <button
                  onClick={handleDownloadReport}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Excel</span>
                </button>
              </div>

              <div className="p-6">
                {/* Report Header */}
                <div className="mb-6 pb-4 border-b">
                  <h3 className="text-xl font-bold mb-1">
                    {reportPreview.title}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{reportPreview.dateRange}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <FileText className="h-4 w-4 mr-1" />
                    <span>
                      Generated on {new Date().toLocaleDateString()} at{" "}
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Report Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {reportPreview.summary.map((item, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 p-4 rounded-lg border"
                    >
                      <div className="text-gray-500 text-sm mb-1">
                        {item.label}
                      </div>
                      <div className="text-2xl font-bold">{item.value}</div>
                      {item.change !== undefined && (
                        <div
                          className={`text-xs flex items-center mt-1 ${
                            item.change >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {item.change >= 0 ? "↑" : "↓"} {Math.abs(item.change)}
                          % from previous period
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Report Sections */}
                {reportPreview.sections &&
                  reportPreview.sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="mb-8">
                      <h4 className="text-lg font-medium mb-4 flex items-center">
                        {section.icon === "users" && (
                          <Users className="h-5 w-5 text-blue-500 mr-2" />
                        )}
                        {section.icon === "chart" && (
                          <Book className="h-5 w-5 text-green-500 mr-2" />
                        )}
                        {section.icon === "money" && (
                          <DollarSign className="h-5 w-5 text-purple-500 mr-2" />
                        )}
                        {section.icon === "activity" && (
                          <Activity className="h-5 w-5 text-orange-500 mr-2" />
                        )}
                        {section.title}
                      </h4>

                      {/* Section data tables */}
                      {section.tables &&
                        section.tables.map((table, tableIndex) => (
                          <div key={tableIndex} className="mb-6">
                            <h5 className="text-sm font-medium mb-2">
                              {table.title}
                            </h5>
                            <div className="border rounded-lg overflow-hidden">
                              <table className="w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    {table.headers.map(
                                      (header, headerIndex) => (
                                        <th
                                          key={headerIndex}
                                          className="text-left py-3 px-4 text-sm text-gray-700 border-b"
                                        >
                                          {header}
                                        </th>
                                      )
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {table.rows.map((row, rowIndex) => (
                                    <tr
                                      key={rowIndex}
                                      className={
                                        rowIndex % 2 === 0
                                          ? "bg-white"
                                          : "bg-gray-50"
                                      }
                                    >
                                      {row.map((cell, cellIndex) => (
                                        <td
                                          key={cellIndex}
                                          className="py-3 px-4 text-sm border-b"
                                        >
                                          {cell}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}

                      {/* Charts */}
                      {section.charts && section.charts.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          {section.charts.map((chart, chartIndex) => (
                            <div
                              key={chartIndex}
                              className="border rounded-lg p-4"
                            >
                              <h5 className="text-sm font-medium mb-2">
                                {chart.title}
                              </h5>
                              <div className="h-64 w-full">
                                {renderChart(chart)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportGeneration;
