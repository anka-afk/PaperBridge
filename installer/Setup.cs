using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.Windows.Forms;
using System.IO.Compression;
using System.Reflection;
using System.Security.Cryptography;
using System.Diagnostics;
using System.Web.Script.Serialization;

class Setup : Form {
  static JavaScriptSerializer Json=new JavaScriptSerializer();
  static string AppRoot=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"PaperBridge");
  static string StateRoot=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),"PaperBridge");
  static string CodexHome=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),".codex");
  static string[] Categories={"01 Agent长期记忆","02 Agent上下文管理","03 数学推理与强化学习","04 知识蒸馏与模型压缩","待分类"};
  TextBox vault=new TextBox(),codex=new TextBox(),status=new TextBox();CheckBox auto=new CheckBox();
  [STAThread] static int Main(string[] args){
    try {
      if(args.Contains("--no-ui")) {for(int n=0;n<args.Length-1;n++){if(args[n]=="--state-dir")StateRoot=Path.GetFullPath(args[n+1]);if(args[n]=="--install-dir")AppRoot=Path.GetFullPath(args[n+1]);if(args[n]=="--codex-home")CodexHome=Path.GetFullPath(args[n+1]);}string v=Arg(args,"--vault"),c=Arg(args,"--codex");Install(v,c,true);return 0;}
      Application.EnableVisualStyles();Application.SetCompatibleTextRenderingDefault(false);Application.Run(new Setup());return 0;
    } catch(Exception e){if(!args.Contains("--no-ui"))MessageBox.Show(e.Message,"PaperBridge",MessageBoxButtons.OK,MessageBoxIcon.Error);else Console.Error.WriteLine(e.Message);return 1;}
  }
  static string Arg(string[] a,string name){int i=Array.IndexOf(a,name);if(i<0||i+1>=a.Length)throw new Exception("缺少参数 "+name);return a[i+1];}
  Setup(){Text="PaperBridge · 论文阅读工作流";Width=750;Height=520;StartPosition=FormStartPosition.CenterScreen;Font=new System.Drawing.Font("Microsoft YaHei UI",10);FormBorderStyle=FormBorderStyle.FixedDialog;MaximizeBox=false;
    var title=new Label{Text="Zotero 阅读 · Codex 问答 · Obsidian 笔记",Left=25,Top=22,Width=690,Height=34,Font=new System.Drawing.Font("Microsoft YaHei UI",15,System.Drawing.FontStyle.Bold)};Controls.Add(title);
    Controls.Add(new Label{Text="每台电脑选择自己的路径。账号登录由 Codex 管理，不会随迁移包复制。",Left=25,Top=66,Width=690,Height=30});
    Controls.Add(new Label{Text="Obsidian 知识库",Left=25,Top=110,Width=160});vault.SetBounds(25,140,600,30);vault.Text=FindVault();Controls.Add(vault);var choose=new Button{Text="选择",Left=635,Top=139,Width=70};choose.Click+=(s,e)=>{using(var d=new FolderBrowserDialog()){d.Description="选择包含 .obsidian 文件夹的知识库";if(d.ShowDialog()==DialogResult.OK)vault.Text=d.SelectedPath;}};Controls.Add(choose);
    Controls.Add(new Label{Text="Codex 可执行文件",Left=25,Top=186,Width=220});codex.SetBounds(25,216,600,30);codex.Text=FindCodex();Controls.Add(codex);var binary=new Button{Text="选择",Left=635,Top=215,Width=70};binary.Click+=(s,e)=>{using(var d=new OpenFileDialog{Filter="Codex|codex.exe"})if(d.ShowDialog()==DialogResult.OK)codex.Text=d.FileName;};Controls.Add(binary);
    auto.Text="导入新论文时，使用 Codex 自动分类";auto.Checked=true;auto.SetBounds(25,264,660,30);Controls.Add(auto);
    var install=new Button{Text="安装 / 更新本机配置",Left=25,Top=315,Width=250,Height=42};install.Click+=(s,e)=>{try{Install(vault.Text,codex.Text,auto.Checked);status.Text="配置完成。\r\n在 Zotero → 工具 → 插件 → 齿轮 → Install Plugin From File，分别安装 plugins 文件夹内的三个 XPI，然后重启 Zotero。\r\n在 PDF 阅读器右侧点 Codex 图标即可提问。";Open(Path.Combine(AppRoot,"plugins"));}catch(Exception x){MessageBox.Show(x.Message,"配置未完成");}};Controls.Add(install);
    var folder=new Button{Text="打开安装目录",Left=290,Top=315,Width=180,Height=42};folder.Click+=(s,e)=>Open(AppRoot);Controls.Add(folder);
    var login=new Button{Text="Codex 官方安装说明",Left=485,Top=315,Width=220,Height=42};login.Click+=(s,e)=>Open("https://learn.chatgpt.com/docs/cli");Controls.Add(login);
    status.Multiline=true;status.ReadOnly=true;status.BorderStyle=BorderStyle.None;status.SetBounds(25,376,680,94);status.Text="需要本机已安装 Zotero 10、Obsidian 和 Codex，并在 Codex 中登录。\r\n配置后，论文条目笔记与 Obsidian 主笔记可双向同步。";Controls.Add(status);
  }
  static void Open(string path){try{Process.Start(new ProcessStartInfo(path){UseShellExecute=true});}catch{}}
  static string FindVault(){try{var file=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),"obsidian","obsidian.json");var obj=Json.Deserialize<Dictionary<string,object>>(File.ReadAllText(file));var vs=(Dictionary<string,object>)obj["vaults"];foreach(var v in vs.Values){var d=(Dictionary<string,object>)v;var p=d["path"].ToString();if(Directory.Exists(Path.Combine(p,".obsidian")))return p;}}catch{}return "";}
  static string FindCodex(){var p=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"OpenAI","Codex","bin");if(Directory.Exists(p)){var f=Directory.GetFiles(p,"codex.exe",SearchOption.AllDirectories).OrderByDescending(File.GetLastWriteTimeUtc).FirstOrDefault();if(f!=null)return f;}foreach(var d in (Environment.GetEnvironmentVariable("PATH")??"").Split(';')){try{var f=Path.Combine(d,"codex.exe");if(File.Exists(f))return f;}catch{}}return "";}
  static void Write(string path,string value){Directory.CreateDirectory(Path.GetDirectoryName(path));string t=path+".paperbridge.tmp";File.WriteAllText(t,value,new UTF8Encoding(false));if(File.Exists(path))File.Replace(t,path,null);else File.Move(t,path);}
  static void Install(string vault,string codex,bool autoClassify){
    vault=Path.GetFullPath(vault.Trim());codex=Path.GetFullPath(codex.Trim());if(!Directory.Exists(Path.Combine(vault,".obsidian")))throw new Exception("请选中实际的 Obsidian 知识库，而不是其上级目录。");if(!File.Exists(codex)||!string.Equals(Path.GetFileName(codex),"codex.exe",StringComparison.OrdinalIgnoreCase))throw new Exception("请选择本机 codex.exe，或先安装 Codex。");
    Directory.CreateDirectory(AppRoot);using(var resource=Assembly.GetExecutingAssembly().GetManifestResourceStream("payload.zip")){if(resource==null)throw new Exception("安装包缺少资源");using(var zip=new ZipArchive(resource,ZipArchiveMode.Read)){foreach(var e in zip.Entries){string target=Path.GetFullPath(Path.Combine(AppRoot,e.FullName.Replace('/',Path.DirectorySeparatorChar)));if(!target.StartsWith(AppRoot.TrimEnd(Path.DirectorySeparatorChar)+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase))throw new Exception("安装包路径无效");if(string.IsNullOrEmpty(e.Name)){Directory.CreateDirectory(target);continue;}Directory.CreateDirectory(Path.GetDirectoryName(target));using(var input=e.Open())using(var output=File.Create(target))input.CopyTo(output);}}}
    string pluginsPath=Path.Combine(AppRoot,"plugins"),archivePath=Path.Combine(pluginsPath,"archive");foreach(string oldXpi in Directory.GetFiles(pluginsPath,"paperbridge-*.xpi")){if(Path.GetFileName(oldXpi)=="paperbridge-0.3.0.xpi")continue;Directory.CreateDirectory(archivePath);string archived=Path.Combine(archivePath,Path.GetFileName(oldXpi));File.Copy(oldXpi,archived,true);File.Delete(oldXpi);}
    Directory.CreateDirectory(StateRoot);string cf=Path.Combine(StateRoot,"config.json"),token=null;if(File.Exists(cf)){var old=Json.Deserialize<Dictionary<string,object>>(File.ReadAllText(cf));if(old.ContainsKey("token"))token=old["token"].ToString();File.Copy(cf,cf+".backup",true);}if(string.IsNullOrEmpty(token)){var bytes=new byte[32];using(var rng=RandomNumberGenerator.Create())rng.GetBytes(bytes);token=BitConverter.ToString(bytes).Replace("-","").ToLowerInvariant();}
    string workspace=Path.Combine(StateRoot,"workspace");Directory.CreateDirectory(workspace);string agent=Path.Combine(workspace,"AGENTS.md");if(!File.Exists(agent))File.Copy(Path.Combine(AppRoot,"AGENTS.md"),agent);else if(!File.ReadAllText(agent).Contains("## PaperBridge 双向笔记")){File.Copy(agent,agent+".paperbridge-backup",true);File.AppendAllText(agent,"\r\n\r\n## PaperBridge 双向笔记\r\n\r\nZotero 条目笔记与 Obsidian 主笔记双向同步。Codex 仍只通过 save_note 修改 AI 整理区。遇到冲突先查看 get_sync_status；仅在用户明确选择来源后才能用 sync_notes 的 direction 恢复。\r\n",new UTF8Encoding(false));}
    var config=new {version=1,vaultPath=vault,noteFolder="科研/论文大学习/论文笔记",codexPath=codex,workspacePath=workspace,port=23119,autoClassify=autoClassify,bidirectionalNotes=true,categories=Categories,token=token};Write(cf,Json.Serialize(config));
    Directory.CreateDirectory(CodexHome);string toml=Path.Combine(CodexHome,"config.toml");string existing=File.Exists(toml)?File.ReadAllText(toml):"";if(File.Exists(toml))File.Copy(toml,toml+".paperbridge-backup",true);
    const string start="# BEGIN PAPERBRIDGE MANAGED",end="# END PAPERBRIDGE MANAGED";if(existing.Contains(start)&&existing.Contains(end))existing=Regex.Replace(existing,Regex.Escape(start)+"[\\s\\S]*?"+Regex.Escape(end),"");else if(Regex.IsMatch(existing,@"(?m)^\[mcp_servers\.paperbridge(?:\.|\])"))throw new Exception("已有手动配置的 paperbridge MCP。为避免覆盖，请先备份并改名该段配置。");
    string block="\r\n"+start+"\r\n[mcp_servers.paperbridge]\r\ncommand = "+Json.Serialize(Path.Combine(AppRoot,"runtime","node.exe"))+"\r\nargs = ["+Json.Serialize(Path.Combine(AppRoot,"mcp-server.cjs"))+"]\r\nenabled = true\r\n\r\n[mcp_servers.paperbridge.env]\r\nPAPERBRIDGE_CONFIG = "+Json.Serialize(cf)+"\r\n"+end+"\r\n";Write(toml,existing.TrimEnd()+"\r\n"+block);
  }
}
