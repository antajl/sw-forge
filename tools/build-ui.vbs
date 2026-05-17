Option Explicit
Dim fso, root, partsDir, outPath, bakPath, banner, partNames, i, body, raw, ts, built, bak
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
partsDir = root & "\js\ui-parts"
outPath = root & "\js\ui.js"
bakPath = root & "\js\ui.monolith.bak.js"
partNames = Array("01-preamble.js","02-theme-nav.js","03-i18n.js","04-main-tabs.js","05-stage-filters.js","06-upload.js","06b-ui-utils.js","06c-dashboard-helpers.js","07-depth.js","08-dashboard.js","09-table.js","10-formulas-ui.js","11-rules-ui.js","11-constants-ui.js","11-rules-bootstrap.js","12-app-settings.js","13-changelog.js")
banner = "// =============================================" & vbLf & "// ui.js — built from js/ui-parts/ (do not edit by hand)" & vbLf & "// Rebuild: node tools/build-ui.mjs" & vbLf & "// =============================================" & vbLf & vbLf
body = ""
For i = 0 To UBound(partNames)
  If Not fso.FileExists(partsDir & "\" & partNames(i)) Then
    WScript.Echo "Missing part: " & partNames(i)
    WScript.Quit 1
  End If
  Set ts = fso.OpenTextFile(partsDir & "\" & partNames(i), 1, False, -1)
  raw = ts.ReadAll
  ts.Close
  If Left(raw, 12) = "// ui-parts/" Then
    raw = Mid(raw, InStr(raw, vbLf) + 1)
  End If
  body = body & raw
Next
Set ts = fso.CreateTextFile(outPath, True, False)
ts.Write banner & body
ts.Close
WScript.Echo "wrote js/ui.js from " & (UBound(partNames) + 1) & " parts"
If fso.FileExists(bakPath) Then
  Set ts = fso.OpenTextFile(bakPath, 1, False, -1)
  bak = ts.ReadAll
  ts.Close
  Set ts = fso.OpenTextFile(outPath, 1, False, -1)
  built = ts.ReadAll
  ts.Close
  If InStr(built, "// =============================================") = 1 Then
    built = Mid(built, InStr(built, vbLf & vbLf) + 2)
    built = Mid(built, InStr(built, vbLf) + 1)
  End If
  If bak = built Then
    WScript.Echo "OK: built ui.js matches ui.monolith.bak.js"
  Else
    WScript.Echo "WARN: built ui.js differs from ui.monolith.bak.js"
  End If
End If
