Option Explicit
Dim fso, root, bakPath, partsDir, ts, lines, chunks, i, j, name, startLn, endLn, slice, header, outPath, folder, fn, written
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
bakPath = root & "\js\ui.monolith.bak.js"
partsDir = root & "\js\ui-parts"
If Not fso.FolderExists(partsDir) Then fso.CreateFolder partsDir
Set ts = fso.OpenTextFile(bakPath, 1, False, -1)
lines = Split(ts.ReadAll, vbLf)
ts.Close
chunks = Array( _
  Array("01-preamble.js", 5, 58), _
  Array("02-theme-nav.js", 59, 343), _
  Array("03-i18n.js", 344, 768), _
  Array("04-main-tabs.js", 769, 786), _
  Array("05-stage-filters.js", 787, 1092), _
  Array("06-upload.js", 1093, 1487), _
  Array("06b-ui-utils.js", 1488, 1837), _
  Array("06c-dashboard-helpers.js", 1838, 2471), _
  Array("07-depth.js", 2472, 2843), _
  Array("08-dashboard.js", 2844, 3303), _
  Array("09-table.js", 3304, 4072), _
  Array("10-formulas-ui.js", 4073, 4334), _
  Array("11-rules-ui.js", 4335, 4647), _
  Array("11-constants-ui.js", 4648, 4820), _
  Array("11-rules-bootstrap.js", 4821, 5121), _
  Array("12-app-settings.js", 5122, 5455), _
  Array("13-changelog.js", 5456, 5507) _
)
written = ""
For i = 0 To UBound(chunks)
  name = chunks(i)(0)
  startLn = chunks(i)(1)
  endLn = chunks(i)(2)
  slice = ""
  For j = startLn - 1 To endLn - 1
    If j <= UBound(lines) Then
      If Len(slice) > 0 Then slice = slice & vbLf
      slice = slice & lines(j)
    End If
  Next
  header = "// ui-parts/" & name & " — slice of ui.monolith.bak.js L" & startLn & "-" & endLn & vbLf
  outPath = partsDir & "\" & name
  Set ts = fso.CreateTextFile(outPath, True, False)
  ts.Write header & slice & vbLf
  ts.Close
  written = written & name & ";"
  WScript.Echo "wrote " & name
Next
Set folder = fso.GetFolder(partsDir)
For Each fn In folder.Files
  If LCase(Right(fn.Name, 3)) = ".js" Then
    If InStr(written, fn.Name & ";") = 0 Then
      fso.DeleteFile fn.Path
      WScript.Echo "removed " & fn.Name
    End If
  End If
Next
