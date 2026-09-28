# gh-cred.ps1 — يقرأ توكن GitHub Desktop من Windows Credential Manager ويطبعه بصيغة git credential
# ملاحظة: خرجه يستهلكه git مباشرة كأوراق اعتماد — لا يُعرض للمستخدم
$ErrorActionPreference = 'Stop'
$sig = @'
using System;
using System.Runtime.InteropServices;
public class CredReadApi {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct CREDENTIAL {
    public int Flags; public int Type; public string TargetName; public string Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public int CredentialBlobSize; public IntPtr CredentialBlob; public int Persist;
    public int AttributeCount; public IntPtr Attributes; public string TargetAlias; public string UserName;
  }
  [DllImport("advapi32.dll", CharSet = CharSet.Unicode, EntryPoint = "CredReadW", SetLastError = true)]
  public static extern bool CredReadW(string target, int type, int flags, out IntPtr credPtr);
  [DllImport("advapi32.dll")]
  public static extern void CredFree(IntPtr cred);
}
'@
Add-Type -TypeDefinition $sig

$targets = @(
  'LegacyGeneric:target=GitHub - https://api.github.com/mallouh2',
  'LegacyGeneric:target=git:https://github.com'
)
$token = $null
foreach ($t in $targets) {
  $ptr = [IntPtr]::Zero
  if ([CredReadApi]::CredReadW($t, 1, 0, [ref]$ptr)) {
    $cred = [System.Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][CredReadApi+CREDENTIAL])
    $blob = New-Object byte[] $cred.CredentialBlobSize
    [System.Runtime.InteropServices.Marshal]::Copy($cred.CredentialBlob, $blob, 0, $cred.CredentialBlobSize)
    $asUtf16 = [System.Text.Encoding]::Unicode.GetString($blob).TrimEnd([char]0)
    $asAscii = [System.Text.Encoding]::ASCII.GetString($blob).TrimEnd([char]0)
    [CredReadApi]::CredFree($ptr) | Out-Null
    foreach ($cand in @($asUtf16, $asAscii)) {
      if ($cand -match '^gh[po]_[A-Za-z0-9_]+$') { $token = $cand; break }
    }
    if ($token) { break }
  }
}
if (-not $token) { throw 'no github token found in credential manager' }
Write-Output "username=mallouh2"
Write-Output "password=$token"
