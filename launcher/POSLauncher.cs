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
        private static string stderrLogPath = null;
        private static string stdoutLogPath = null;

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
                stdoutLogPath = Path.Combine(logsDir, "server-stdout.log");
                stderrLogPath = Path.Combine(logsDir, "server-stderr.log");

                Log("----------------------------------------------------");
                Log("Starting AquaPOS System Background Service...");
                Log("Root Directory: " + rootDir);

                try
                {
                    // 1. Check if Node.js is installed
                    if (!IsNodeInstalled())
                    {
                        Log("ERROR: Node.js is not installed or not available in system PATH.");
                        MessageBox.Show(
                            "Node.js Runtime is not installed on this computer.\n\n" +
                            "Please install Node.js (LTS Version) from https://nodejs.org/ and try launching again.",
                            "AquaPOS - Missing Prerequisite",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Warning
                        );
                        return;
                    }

                    // 2. Check if backend server is already responding on port 3001
                    bool serverAlreadyRunning = IsBackendHealthy();

                    if (!serverAlreadyRunning)
                    {
                        Log("Backend not detected on port 3001. Starting Node.js server silently in background...");

                        string serverScript = Path.Combine(rootDir, "apps", "server", "dist", "main.js");
                        if (!File.Exists(serverScript))
                        {
                            Log("ERROR: Server entry point not found at " + serverScript);
                            MessageBox.Show("POS System could not start (Missing server bundle).\n\nPlease run 'npm run build' or copy full build files.", "AquaPOS Startup Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                            return;
                        }

                        // Clear old logs
                        try { if (File.Exists(stdoutLogPath)) File.Delete(stdoutLogPath); } catch { }
                        try { if (File.Exists(stderrLogPath)) File.Delete(stderrLogPath); } catch { }

                        ProcessStartInfo psi = new ProcessStartInfo
                        {
                            FileName = "node",
                            Arguments = "\"" + serverScript + "\"",
                            WorkingDirectory = rootDir,
                            CreateNoWindow = true,
                            UseShellExecute = false,
                            RedirectStandardOutput = true,
                            RedirectStandardError = true,
                            WindowStyle = ProcessWindowStyle.Hidden
                        };

                        Process serverProc = new Process();
                        serverProc.StartInfo = psi;

                        serverProc.OutputDataReceived += (sender, e) =>
                        {
                            if (!string.IsNullOrEmpty(e.Data))
                            {
                                try { File.AppendAllText(stdoutLogPath, "[" + DateTime.Now.ToString("HH:mm:ss") + "] " + e.Data + Environment.NewLine); } catch { }
                            }
                        };

                        serverProc.ErrorDataReceived += (sender, e) =>
                        {
                            if (!string.IsNullOrEmpty(e.Data))
                            {
                                try { File.AppendAllText(stderrLogPath, "[" + DateTime.Now.ToString("HH:mm:ss") + "] " + e.Data + Environment.NewLine); } catch { }
                            }
                        };

                        bool started = serverProc.Start();
                        if (started)
                        {
                            serverProc.BeginOutputReadLine();
                            serverProc.BeginErrorReadLine();
                            Log("Node server background process launched with PID: " + serverProc.Id.ToString());
                        }
                    }
                    else
                    {
                        Log("Backend server is already running on port 3001.");
                    }

                    // 3. Wait up to 30 seconds for backend health check
                    Log("Waiting for backend API health check on http://localhost:3001...");
                    bool healthy = WaitForBackend(30000);

                    if (!healthy)
                    {
                        string detailedError = GetStderrSummary();
                        Log("ERROR: Backend server failed to respond within 30s. Stderr: " + detailedError);

                        string userMessage = "POS System backend server failed to start within timeout.\n\n";
                        if (!string.IsNullOrEmpty(detailedError))
                        {
                            userMessage += "Diagnostic details:\n" + detailedError + "\n\n";
                        }
                        userMessage += "Please check that dependencies are installed (run 'npm install --omit=dev') or view logs/server-stderr.log.";

                        MessageBox.Show(userMessage, "AquaPOS Startup Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        return;
                    }

                    Log("Backend server confirmed HEALTHY on http://localhost:3001.");

                    // 4. Open POS System in Default Browser
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
                    MessageBox.Show("POS System encountered an error during startup:\n\n" + ex.Message, "AquaPOS Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }

        private static bool IsNodeInstalled()
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "node",
                    Arguments = "-v",
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    RedirectStandardOutput = true
                };
                using (Process p = Process.Start(psi))
                {
                    p.WaitForExit(3000);
                    return p.ExitCode == 0;
                }
            }
            catch
            {
                return false;
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

        private static string GetStderrSummary()
        {
            if (string.IsNullOrEmpty(stderrLogPath) || !File.Exists(stderrLogPath)) return "";
            try
            {
                string[] lines = File.ReadAllLines(stderrLogPath);
                if (lines.Length == 0) return "";
                int count = Math.Min(5, lines.Length);
                string[] lastLines = new string[count];
                Array.Copy(lines, lines.Length - count, lastLines, 0, count);
                return string.Join(Environment.NewLine, lastLines);
            }
            catch
            {
                return "";
            }
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
