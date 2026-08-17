using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;

namespace WaterPOSLauncher
{
    static class Program
    {
        private static readonly string MutexName = "AquaPOSLauncherMutex_2026";
        private static string logFilePath = null;

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            bool isNewInstance;
            using (Mutex mutex = new Mutex(true, MutexName, out isNewInstance))
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                string rootDir = baseDir;

                // Find root directory containing apps/server
                if (!Directory.Exists(Path.Combine(rootDir, "apps", "server")) && Directory.Exists(Path.Combine(rootDir, "..", "apps", "server")))
                {
                    rootDir = Path.GetFullPath(Path.Combine(rootDir, ".."));
                }

                string logsDir = Path.Combine(rootDir, "logs");
                if (!Directory.Exists(logsDir))
                {
                    try { Directory.CreateDirectory(logsDir); } catch { }
                }
                logFilePath = Path.Combine(logsDir, "launcher.log");

                Log("----------------------------------------------------");
                Log("Starting AquaPOS System Background Service...");
                Log("Root Directory: " + rootDir);

                try
                {
                    // 1. Check if backend is already responding on port 3001
                    bool serverAlreadyRunning = IsBackendHealthy();

                    if (!serverAlreadyRunning)
                    {
                        Log("Backend not detected on port 3001. Starting Node.js server silently in background...");

                        string serverScript = Path.Combine(rootDir, "apps", "server", "dist", "main.js");
                        if (!File.Exists(serverScript))
                        {
                            Log("ERROR: Server entry point not found at " + serverScript);
                            MessageBox.Show("POS System could not start (Missing server bundle). Please run 'npm run build' first.", "WaterPOS Startup Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                            return;
                        }

                        ProcessStartInfo psi = new ProcessStartInfo
                        {
                            FileName = "node",
                            Arguments = "\"" + serverScript + "\"",
                            WorkingDirectory = rootDir,
                            CreateNoWindow = true,
                            UseShellExecute = false,
                            WindowStyle = ProcessWindowStyle.Hidden
                        };

                        Process serverProc = Process.Start(psi);
                        Log("Node server background process launched with PID: " + (serverProc != null ? serverProc.Id.ToString() : "UNKNOWN"));
                    }
                    else
                    {
                        Log("Backend server is already running on port 3001.");
                    }

                    // 2. Wait for backend to initialize
                    Log("Waiting for backend API health check on http://localhost:3001...");
                    bool healthy = WaitForBackend(15000);

                    if (!healthy)
                    {
                        Log("ERROR: Backend server failed to respond within timeout.");
                        MessageBox.Show("POS System could not start. Please contact the administrator.", "WaterPOS Startup Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        return;
                    }

                    Log("Backend server confirmed HEALTHY on http://localhost:3001.");

                    // 3. Open POS System in Default Browser
                    string targetUrl = "http://localhost:3001";
                    Log("Opening POS application URL in browser: " + targetUrl);

                    ProcessStartInfo browserPsi = new ProcessStartInfo
                    {
                        FileName = targetUrl,
                        UseShellExecute = true
                    };
                    Process.Start(browserPsi);

                    Log("POS Application opened in browser. Background server will continue running.");
                }
                catch (Exception ex)
                {
                    Log("FATAL EXCEPTION: " + ex.ToString());
                    MessageBox.Show("POS System encountered an error during startup. Please contact the administrator.", "WaterPOS Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }

        private static bool IsBackendHealthy()
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://localhost:3001/api/v1/health");
                req.Timeout = 2000;
                req.Method = "GET";
                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                {
                    return resp.StatusCode == HttpStatusCode.OK;
                }
            }
            catch
            {
                return false;
            }
        }

        private static bool WaitForBackend(int timeoutMs)
        {
            int elapsed = 0;
            int step = 500;
            while (elapsed < timeoutMs)
            {
                if (IsBackendHealthy()) return true;
                Thread.Sleep(step);
                elapsed += step;
            }
            return false;
        }

        private static void Log(string message)
        {
            if (string.IsNullOrEmpty(logFilePath)) return;
            try
            {
                string line = "[" + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "] " + message + Environment.NewLine;
                File.AppendAllText(logFilePath, line);
            }
            catch { }
        }
    }
}
