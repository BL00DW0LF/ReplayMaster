/*bad todo

clean up byte position tracking before/after result data, so can flex more depending on result_data length

to be more flexible for supporting new file types, should get versions, then save locations of all data entry points to global variables.  only call to do functions to data on versiosn that support it at runtime instead of big if statements



bulk mode steam name overwrite is kinda naieve?  should do both name and display name based on base steamid/name.  if fix this, do it everywhere (incl sniper files)

support v5 replays and v2 result_data


*/


var firstReplayLoad = true;
var ogFileBuffer;
var dataView;
var dataView2
var filename;

var fileQueue=-1;
var fileQueuePos=-1;
var fileStyle=-1;
var filesList=new Array();

var ogNameSize=-1;
//var dataStart;//I'm not sure I use this


var SniperFileVersion=-1;
var SniperFileName="";
var SniperFileDisplayName="";
var ogSniperNameSize=-1;
var SniperResultFlagsVersion=-1;
var SniperResultFlagsVersionFinal=-1;
var SniperNewResult=-1;
var SniperStartTime=-1;


var ReplayFileVersion=-1;
var ResultFlagsVersion=-1;
var ResultFlagsVersionFinal=-1;
var Duration=-1;
var StartTime=-1;
var Result=-1;
var SpyName="";
var SniperName="";
var SpyDisplayName="";
var SniperDisplayName="";
var BaseNameIndex=-1;

var originalPlayerName=new Array();
var newPlayerName=new Array();
var originalSteamName=new Array();
var newSteamName=new Array();

var isReplay=false;
var isSniper=false;


function dropHandler(ev){
	//console.log('File(s) dropped');
	//alert("File Dropped");
	
	// Prevent default behavior (Prevent file from being opened)
	ev.preventDefault();
	
	
	fileQueuePos=0;
	
	if (ev.dataTransfer.items) {
		filesList=new Array();
		
		// Use DataTransferItemList interface to access the file(s)
		for (i=0; i<ev.dataTransfer.items.length; i++){
			
			// If dropped items aren't files, reject them
			if (ev.dataTransfer.items[0].kind === 'file') {
			//if (filesList[0].kind === 'file') {//testing
				filesList.push(ev.dataTransfer.items[i].getAsFile());
				
				
				
				
				
				//filename = ev.dataTransfer.items[0].getAsFile().name;
				//processFile(ev.dataTransfer.items[0].getAsFile());
				
				
			}
		}//end loop
		fileQueue=filesList.length;
		fileStyle=1;//input style?
		//alert("file queue = "+fileQueue);
		if(fileQueue>1){
			//alert("attempting sort");
			//filesList.sort(sortListByPlayID);
		}
		filename = filesList[0].name;
		processFile(filesList[0]);
		firstReplayLoad=false;
	} 
	else {
		// Use DataTransfer interface to access the file(s)
		alert("This method of file loading is not as tested (my fault, not yours).  Let me know if you saw this and whether it worked?");
		filesList=new Array();
		fileQueue=ev.dataTransfer.files.length;
		fileStyle=2;//input style?
		
		
		for (i=0; i<fileQueue; i++){
			filesList.push(ev.dataTransfer.files[i]);
			
		}
		
		//alert("file queue = "+fileQueue);
		if(fileQueue>1){
			//alert("attempting sort");
			//filesList.sort(sortListByPlayID);
		}
		filename = ev.dataTransfer.files[0].name;
		processFile(ev.dataTransfer.files[0]);
		firstReplayLoad=false;
	}
	
	//alert("fileStyle ="+fileStyle+" fileQueue ="+fileQueue);
	
}

function dragOverHandler(ev) {
  //console.log('File(s) in drop zone');

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
}



function processFile(rawFile){
	
	const reader = new FileReader();
	
	reader.onload = function(e) {
		ogFileBuffer=e.target.result;
		
		
		wipeDataDisplay();
		
		
		//dataview is format for pulling data
		dataView = new DataView(ogFileBuffer);
		
		
		//if it's a replay, first four bytes are R,P,L,Y
		if (dataView.getUint32(0,true)==1498173522){
			isReplay=true;
			document.getElementById("SniperFileHideable").style.display = 'none';
			document.getElementById("ReplayFileHideable").style.display = 'block';
			
			
			ReplayFileVersion = dataView.getUint32(4,true);//replay version number
			document.getElementById("ReplayFileVersion").innerHTML="v"+ReplayFileVersion;
			
			
			if (ReplayFileVersion==6){//if replay v6
				var P2PProtocolVersion = dataView.getUint32(8,true);//p2p protocol version
				document.getElementById("P2PProtocolVersion").innerHTML=P2PProtocolVersion;
				
				var RevnoVersion = dataView.getUint32(12,true);//revno version
				document.getElementById("RevnoVersion").innerHTML=RevnoVersion;
				
				var Flags = dataView.getUint32(16,true);//flags?????
				document.getElementById("Flags").innerHTML=Flags;
				
				Duration = dataView.getFloat32(20,true);//Duration
				document.getElementById("Duration").innerHTML=Duration;
				if(document.getElementById("DurationAutofill").checked)//if we're autofilling this
					document.getElementById("DurationNew").value=Duration;
				
				
				var GameID = "{";//GameID string builder  need to grab 24-39
				GameID=GameID+ dataView.getUint32(24,true).toString(16)+"-";
				GameID=GameID+ dataView.getUint16(28,true).toString(16)+"-";
				GameID=GameID+ dataView.getUint16(30,true).toString(16)+"-";
				GameID=GameID+ dataView.getUint16(32,false).toString(16)+"-";
				GameID=GameID+ dataView.getUint32(34,false).toString(16);
				GameID=GameID+ dataView.getUint16(38,false).toString(16)+"} (probably???)";
				document.getElementById("GameID").innerHTML=GameID;
				
				
				StartTime = dataView.getUint32(40,true);//StartTime
				document.getElementById("StartTime").innerHTML=StartTime+" (Unix time stamp)";
				if(document.getElementById("StartTimeAutofill").checked)//if we're autofilling this
					document.getElementById("StartTimeNew").value=StartTime;
				
				var PlayID = dataView.getUint16(44,true);//PlayID
				document.getElementById("PlayID").innerHTML=PlayID;
				
				var SpyUsernameLength = dataView.getUint8(46,true);//SpyUsernameLength
				document.getElementById("SpyUsernameLength").innerHTML=SpyUsernameLength;
				
				var SniperUsernameLength = dataView.getUint8(47,true);//SniperUsernameLength
				document.getElementById("SniperUsernameLength").innerHTML=SniperUsernameLength;
				
				var SpyDisplayNameLength = dataView.getUint8(48,true);//SpyDisplayNameLength
				document.getElementById("SpyDisplayNameLength").innerHTML=SpyDisplayNameLength;
				
				var SniperDisplayNameLength = dataView.getUint8(49,true);//SniperDisplayNameLength
				document.getElementById("SniperDisplayNameLength").innerHTML=SniperDisplayNameLength;
				
				//ResultData unpacking
				processResultData(52);
				
				
				var ClientLatency = dataView.getFloat32(92,true);//ClientLatency
				document.getElementById("ClientLatency").innerHTML=ClientLatency;
				
				var PacketDataSize = dataView.getUint32(96,true);//PacketDataSize
				document.getElementById("PacketDataSize").innerHTML=PacketDataSize;
				
				BaseNameIndex=100;
				
				//get names, spy first
				var spyNameUTF8Array=Array();
				for (i=0; i<SpyUsernameLength;i++){
					
					spyNameUTF8Array.push(dataView.getUint8((BaseNameIndex+i)));
					
				}
				SpyName=Utf8ArrayToStr(spyNameUTF8Array);
				document.getElementById("SpyName").innerHTML=SpyName;
				if(document.getElementById("SpyNameAutofill").checked)//if we're autofilling this
					document.getElementById("SpyNameNew").value=SpyName;
				
				
				//get names, sniper now
				var sniperNameUTF8Array=Array();
				for (i=0; i<SniperUsernameLength;i++){
					
					sniperNameUTF8Array.push(dataView.getUint8((BaseNameIndex+SpyUsernameLength+i)));
					
				}
				SniperName=Utf8ArrayToStr(sniperNameUTF8Array);
				document.getElementById("SniperName").innerHTML=SniperName;
				if(document.getElementById("SniperNameAutofill").checked)//if we're autofilling this
					document.getElementById("SniperNameNew").value=SniperName;
				
				
				//get spy steam name if applicable
				if (SpyDisplayNameLength>0){
					var spyDisplayNameUTF8Array=Array();
					for (i=0; i<SpyDisplayNameLength;i++){
						spyDisplayNameUTF8Array.push(dataView.getUint8((BaseNameIndex+SpyUsernameLength+SniperUsernameLength+i)));
					}
					SpyDisplayName=Utf8ArrayToStr(spyDisplayNameUTF8Array);
					document.getElementById("SpyDisplayName").innerHTML=SpyDisplayName;
					if(document.getElementById("SpyDisplayNameAutofill").checked)//if we're autofilling this
						document.getElementById("SpyDisplayNameNew").value=SpyDisplayName;
				}
				else if(document.getElementById("SpyDisplayNameAutofill").checked)//if we're autofilling this, and Spy Display Name is blank
					document.getElementById("SpyDisplayNameNew").value="";
				
				
				//get sniper steam name if applicable
				if (SniperDisplayNameLength>0){
					var sniperDisplayNameUTF8Array=Array();
					for (i=0; i<SniperDisplayNameLength;i++){
						sniperDisplayNameUTF8Array.push(dataView.getUint8((BaseNameIndex+SpyUsernameLength+SniperUsernameLength+SpyDisplayNameLength+i)));
					}
					SniperDisplayName=Utf8ArrayToStr(sniperDisplayNameUTF8Array);
					document.getElementById("SniperDisplayName").innerHTML=SniperDisplayName;
					if(document.getElementById("SniperDisplayNameAutofill").checked)//if we're autofilling this
						document.getElementById("SniperDisplayNameNew").value=SniperDisplayName;
				}
				else if(document.getElementById("SniperDisplayNameAutofill").checked)//if we're autofilling this and Display Name is blank
					document.getElementById("SniperDisplayNameNew").value="";
				
				
				//remember data start so we can copy it unaltered BaseNameIndex+spyname+snipername+spydisplayname+sniperdisplayname
				ogNameSize=SpyUsernameLength+SniperUsernameLength+SpyDisplayNameLength+SniperDisplayNameLength;
				//dataStart = BaseNameIndex+ogNameSize;//I'm not sure I use dataStart
				
				
				
				
				//bulk mode - overwrites fields
				if(document.getElementById("nameBulk").checked){//if name bulk is enabled
					
					//test if current spy name is in our list already
					var testedIndex=containsObject(SpyName,originalPlayerName);
					if(testedIndex!=-1){
						//if here, then originalPlayerName already contains the original name at testedIndex
						document.getElementById("SpyNameNew").value=newPlayerName[testedIndex].toString();
						//alert(newPlayerName[testedIndex]);
					}
					
					//test if current sniper name is in our list already
					testedIndex=containsObject(SniperName,originalPlayerName);
					if(testedIndex!=-1){
						//if here, then originalPlayerName already contains the original name at testedIndex
						document.getElementById("SniperNameNew").value=newPlayerName[testedIndex].toString();
					}
					
					//test if current spy display name is in our list already
					var testedIndex=containsObject(SpyDisplayName,originalPlayerName);
					if(testedIndex!=-1){
						//if here, then originalPlayerName already contains the original name at testedIndex
						document.getElementById("SpyDisplayNameNew").value=newPlayerName[testedIndex].toString();
					}
					
					//test if current sniper display name is in our list already
					testedIndex=containsObject(SniperDisplayName,originalPlayerName);
					if(testedIndex!=-1){
						//if here, then originalPlayerName already contains the original name at testedIndex
						document.getElementById("SniperDisplayNameNew").value=newPlayerName[testedIndex].toString();
					}
				}
				
				
				
				updateTime("DurationNew");
				updateTime("StartDurationSeconds");
				displayUnixTime();
				
			}
			else if (ReplayFileVersion==7){//if replay v7
				var P2PProtocolVersion = dataView.getUint32(8,true);//p2p protocol version
				document.getElementById("P2PProtocolVersion").innerHTML=P2PProtocolVersion;
				
				var RevnoVersion = dataView.getUint32(12,true);//revno version
				document.getElementById("RevnoVersion").innerHTML=RevnoVersion;
				
				var ChangelistVersion = dataView.getUint32(16,true);//ChangelistVersion
				document.getElementById("ChangelistVersion").innerHTML=ChangelistVersion;
				
				var Flags = dataView.getUint32(20,true);//flags?????
				document.getElementById("Flags").innerHTML=Flags;
				
				Duration = dataView.getFloat32(24,true);//Duration
				document.getElementById("Duration").innerHTML=Duration;
				if(document.getElementById("DurationAutofill").checked)//if we're autofilling this
					document.getElementById("DurationNew").value=Duration;
				
				
				var GameID = "{";//GameID string builder  need to grab 24-39
				GameID=GameID+ dataView.getUint32(28,true).toString(16)+"-";
				GameID=GameID+ dataView.getUint16(32,true).toString(16)+"-";
				GameID=GameID+ dataView.getUint16(34,true).toString(16)+"-";
				GameID=GameID+ dataView.getUint16(36,false).toString(16)+"-";
				GameID=GameID+ dataView.getUint32(38,false).toString(16);
				GameID=GameID+ dataView.getUint16(42,false).toString(16)+"} (probably???)";
				document.getElementById("GameID").innerHTML=GameID;
				
				StartTime = dataView.getUint32(44,true);//StartTime
				document.getElementById("StartTime").innerHTML=StartTime+" (Unix time stamp)";
				if(document.getElementById("StartTimeAutofill").checked)//if we're autofilling this
					document.getElementById("StartTimeNew").value=StartTime;
				
				var PlayID = dataView.getUint16(48,true);//PlayID
				document.getElementById("PlayID").innerHTML=PlayID;
				
				var SpyUsernameLength = dataView.getUint8(50,true);//SpyUsernameLength
				document.getElementById("SpyUsernameLength").innerHTML=SpyUsernameLength;
				
				var SniperUsernameLength = dataView.getUint8(51,true);//SniperUsernameLength
				document.getElementById("SniperUsernameLength").innerHTML=SniperUsernameLength;
				
				var SpyDisplayNameLength = dataView.getUint8(52,true);//SpyDisplayNameLength
				document.getElementById("SpyDisplayNameLength").innerHTML=SpyDisplayNameLength;
				
				var SniperDisplayNameLength = dataView.getUint8(53,true);//SniperDisplayNameLength
				document.getElementById("SniperDisplayNameLength").innerHTML=SniperDisplayNameLength;
				
				//ResultData unpacking
				processResultData(56);
				
				
				var ClientLatency = dataView.getFloat32(96,true);//ClientLatency
				document.getElementById("ClientLatency").innerHTML=ClientLatency;
				
				var PacketDataSize = dataView.getUint32(100,true);//PacketDataSize
				document.getElementById("PacketDataSize").innerHTML=PacketDataSize;
				
				BaseNameIndex=104;
				
				//get names, spy first
				var spyNameUTF8Array=Array();
				for (i=0; i<SpyUsernameLength;i++){
					
					spyNameUTF8Array.push(dataView.getUint8((BaseNameIndex+i)));
					
				}
				SpyName=Utf8ArrayToStr(spyNameUTF8Array);
				document.getElementById("SpyName").innerHTML=SpyName;
				if(document.getElementById("SpyNameAutofill").checked)//if we're autofilling this
					document.getElementById("SpyNameNew").value=SpyName;
				
				
				//get names, sniper now
				var sniperNameUTF8Array=Array();
				for (i=0; i<SniperUsernameLength;i++){
					
					sniperNameUTF8Array.push(dataView.getUint8((BaseNameIndex+SpyUsernameLength+i)));
					
				}
				SniperName=Utf8ArrayToStr(sniperNameUTF8Array);
				document.getElementById("SniperName").innerHTML=SniperName;
				if(document.getElementById("SniperNameAutofill").checked)//if we're autofilling this
					document.getElementById("SniperNameNew").value=SniperName;
				
				
				//get spy steam name if applicable
				if (SpyDisplayNameLength>0){
					var spyDisplayNameUTF8Array=Array();
					for (i=0; i<SpyDisplayNameLength;i++){
						spyDisplayNameUTF8Array.push(dataView.getUint8((BaseNameIndex+SpyUsernameLength+SniperUsernameLength+i)));
					}
					SpyDisplayName=Utf8ArrayToStr(spyDisplayNameUTF8Array);
					document.getElementById("SpyDisplayName").innerHTML=SpyDisplayName;
					if(document.getElementById("SpyDisplayNameAutofill").checked)//if we're autofilling this
						document.getElementById("SpyDisplayNameNew").value=SpyDisplayName;
				}
				else if(document.getElementById("SpyDisplayNameAutofill").checked)//if we're autofilling this, and Spy Display Name is blank
					document.getElementById("SpyDisplayNameNew").value="";
				
				
				//get sniper steam name if applicable
				if (SniperDisplayNameLength>0){
					var sniperDisplayNameUTF8Array=Array();
					for (i=0; i<SniperDisplayNameLength;i++){
						sniperDisplayNameUTF8Array.push(dataView.getUint8((BaseNameIndex+SpyUsernameLength+SniperUsernameLength+SpyDisplayNameLength+i)));
					}
					SniperDisplayName=Utf8ArrayToStr(sniperDisplayNameUTF8Array);
					document.getElementById("SniperDisplayName").innerHTML=SniperDisplayName;
					if(document.getElementById("SniperDisplayNameAutofill").checked)//if we're autofilling this
						document.getElementById("SniperDisplayNameNew").value=SniperDisplayName;
				}
				else if(document.getElementById("SniperDisplayNameAutofill").checked)//if we're autofilling this and Display Name is blank
					document.getElementById("SniperDisplayNameNew").value="";
				
				
				//remember data start so we can copy it unaltered BaseNameIndex+spyname+snipername+spydisplayname+sniperdisplayname
				ogNameSize=SpyUsernameLength+SniperUsernameLength+SpyDisplayNameLength+SniperDisplayNameLength;
				//dataStart = BaseNameIndex+ogNameSize;//I'm not sure I use dataStart
				
				
				
				
				//bulk mode - overwrites fields
				if(document.getElementById("nameBulk").checked){//if name bulk is enabled
					
					//test if current spy name is in our list already
					var testedIndex=containsObject(SpyName,originalPlayerName);
					if(testedIndex!=-1){
						//if here, then originalPlayerName already contains the original name at testedIndex
						document.getElementById("SpyNameNew").value=newPlayerName[testedIndex].toString();
						//alert(newPlayerName[testedIndex]);
					}
					
					//test if current sniper name is in our list already
					testedIndex=containsObject(SniperName,originalPlayerName);
					if(testedIndex!=-1){
						//if here, then originalPlayerName already contains the original name at testedIndex
						document.getElementById("SniperNameNew").value=newPlayerName[testedIndex].toString();
					}
					
					//test if current spy display name is in our list already
					var testedIndex=containsObject(SpyDisplayName,originalPlayerName);
					if(testedIndex!=-1){
						//if here, then originalPlayerName already contains the original name at testedIndex
						document.getElementById("SpyDisplayNameNew").value=newPlayerName[testedIndex].toString();
					}
					
					//test if current sniper display name is in our list already
					testedIndex=containsObject(SniperDisplayName,originalPlayerName);
					if(testedIndex!=-1){
						//if here, then originalPlayerName already contains the original name at testedIndex
						document.getElementById("SniperDisplayNameNew").value=newPlayerName[testedIndex].toString();
					}
				}
				
				
				updateTime("DurationNew");
				updateTime("StartDurationSeconds");
				displayUnixTime();
				
			}//end if replay v7
			else{
				alert("This replay version not supported yet: "+ReplayFileVersion);
			}
			
		}//end if it's a replay
		else if (dataView.getUint32(0,true)==1314082898){//test if it's a sniper file, first four bytes are RPSN
			isSniper=true;
			document.getElementById("SniperFileHideable").style.display = 'block';
			document.getElementById("ReplayFileHideable").style.display = 'none';
			
			
			SniperFileVersion = dataView.getUint32(4,true);//sniper version number
			document.getElementById("SniperFileVersion").innerHTML="v"+SniperFileVersion;
			
			if (SniperFileVersion==6){//for v6 SNIPER replays
				
				var P2PProtocolVersion = dataView.getUint32(8,true);//p2p protocol version
				document.getElementById("SniperP2PProtocolVersion").innerHTML=P2PProtocolVersion;
				
				var RevnoVersion = dataView.getUint32(12,true);//revno version
				document.getElementById("SniperRevnoVersion").innerHTML=RevnoVersion;
				
				var ChangelistVersion = dataView.getUint32(16,true);//ChangelistVersion
				document.getElementById("SniperChangelistVersion").innerHTML=ChangelistVersion;
				
				
				var GameID = "{";//GameID string builder  
				GameID=GameID+ dataView.getUint32(20,true).toString(16)+"-";
				GameID=GameID+ dataView.getUint16(24,true).toString(16)+"-";
				GameID=GameID+ dataView.getUint16(26,true).toString(16)+"-";
				GameID=GameID+ dataView.getUint16(28,false).toString(16)+"-";
				GameID=GameID+ dataView.getUint32(30,false).toString(16);
				GameID=GameID+ dataView.getUint16(34,false).toString(16)+"} (probably???)";
				document.getElementById("SniperGameID").innerHTML=GameID;
				
				var InstanceID = "{";//InstanceIDID string builder  
				InstanceID=InstanceID+ dataView.getUint32(36,true).toString(16)+"-";
				InstanceID=InstanceID+ dataView.getUint16(40,true).toString(16)+"-";
				InstanceID=InstanceID+ dataView.getUint16(42,true).toString(16)+"-";
				InstanceID=InstanceID+ dataView.getUint16(44,false).toString(16)+"-";
				InstanceID=InstanceID+ dataView.getUint32(46,false).toString(16);
				InstanceID=InstanceID+ dataView.getUint16(50,false).toString(16)+"} (probably???)";
				document.getElementById("SniperInstanceID").innerHTML=InstanceID;
				
				StartTime = dataView.getUint32(52,true);//StartTime
				document.getElementById("SniperStartTime").innerHTML=StartTime+" (Unix time stamp)";
				if(document.getElementById("SniperStartTimeAutofill").checked)//if we're autofilling this
					document.getElementById("SniperStartTimeNew").value=StartTime;
				
				var PlayID = dataView.getUint16(56,true);//PlayID
				document.getElementById("SniperPlayID").innerHTML=PlayID;
				
				var Flags = dataView.getUint8(58,true);//flags?????
				document.getElementById("SniperFlags").innerHTML=Flags;
				
				var SniperUsernameLength = dataView.getUint8(59,true);//SniperUsernameLength
				document.getElementById("SniperFileUsernameLength").innerHTML=SniperUsernameLength;
				
				var SniperDisplayNameLength = dataView.getUint8(60,true);//SniperDisplayNameLength
				document.getElementById("SniperFileDisplayNameLength").innerHTML=SniperDisplayNameLength;
				
				var ClientLatency = dataView.getFloat32(64,true);//ClientLatency
				document.getElementById("SniperClientLatency").innerHTML=ClientLatency;
				
				var FirstResultGameDuration=dataView.getFloat32(68,true);//FirstResultGameDuration
				document.getElementById("SniperDuration").innerHTML=FirstResultGameDuration;
				
				var TotalSniperGameDuration=dataView.getFloat32(72,true);//TotalGameDuration
				document.getElementById("SniperTotalDuration").innerHTML=TotalSniperGameDuration;
				
				
				processSniperResultData(76);
				
				var PacketDataSize = dataView.getUint32(92,true);//PacketDataSize
				document.getElementById("SniperPacketDataSize").innerHTML=PacketDataSize;
				
				BaseNameIndex=96;
								
				//get names, sniper now
				var sniperNameUTF8Array=Array();
				for (i=0; i<SniperUsernameLength;i++){
					
					sniperNameUTF8Array.push(dataView.getUint8((BaseNameIndex+i)));
					
				}
				SniperFileName=Utf8ArrayToStr(sniperNameUTF8Array);
				document.getElementById("SniperFileName").innerHTML=SniperFileName;
				if(document.getElementById("SniperFileNameAutofill").checked)//if we're autofilling this
					document.getElementById("SniperFileNameNew").value=SniperFileName;
				
				//get sniper steam name if applicable
				if (SniperDisplayNameLength>0){
					var sniperDisplayNameUTF8Array=Array();
					for (i=0; i<SniperDisplayNameLength;i++){
						sniperDisplayNameUTF8Array.push(dataView.getUint8((BaseNameIndex+SniperUsernameLength+i)));
					}
					SniperFileDisplayName=Utf8ArrayToStr(sniperDisplayNameUTF8Array);
					document.getElementById("SniperFileDisplayName").innerHTML=SniperFileDisplayName;
					if(document.getElementById("SniperFileDisplayNameAutofill").checked)//if we're autofilling this
						document.getElementById("SniperFileDisplayNameNew").value=SniperFileDisplayName;
				}
				else if(document.getElementById("SniperFileDisplayNameAutofill").checked)//if we're autofilling this and Display Name is blank
					document.getElementById("SniperFileDisplayNameNew").value="";
				
				
				//remember data start so we can copy it unaltered 
				ogSniperNameSize=SniperUsernameLength+SniperDisplayNameLength;
				
				
				
				
				//bulk mode - overwrites fields
				if(document.getElementById("nameBulk").checked){//if name bulk is enabled
					
					//test if current sniper name is in our list already
					testedIndex=containsObject(SniperFileName,originalPlayerName);
					if(testedIndex!=-1){
						//if here, then originalPlayerName already contains the original name at testedIndex
						document.getElementById("SniperFileNameNew").value=newPlayerName[testedIndex].toString();
					}
					//test if current sniper display name is in our list already
					testedIndex=containsObject(SniperFileDisplayName,originalPlayerName);
					if(testedIndex!=-1){
						//if here, then originalPlayerName already contains the original name at testedIndex
						document.getElementById("SniperFileDisplayNameNew").value=newPlayerName[testedIndex].toString();
					}
				}
				
				
				displaySniperUnixTime();
				
				
				
				
				
			}
			else{//unsupported version
				alert("This sniper version not supported yet: "+SniperFileVersion);
				
			}
			
			
			
		}
		else{
			alert("Unknown file type, not Replay or Sniper.");
			
		}
		
		
		
		
	};
	reader.readAsArrayBuffer(rawFile);
	//fileData = reader.result;
	//alert (typeof(fileData));
	
	
	
  
}

function processSniperResultData(startIndex){
	SniperResultFlagsVersion = dataView.getUint32(startIndex,true);//Result_data: FlagsVersion
	SniperResultFlagsVersionFinal=SniperResultFlagsVersion&0xf;// the top stuff is the version, everything else are flags.
	
	document.getElementById("SniperResultFlagsVersion").innerHTML="v"+SniperResultFlagsVersionFinal;
	
	if(SniperResultFlagsVersionFinal==2){
		
		//display extras = simplified or handicapped
		//if (ResultFlagsVersion&0x10)//if there's a bit in the 1s place, ignoring first stuff
		//	document.getElementById("Simplified").innerHTML="Yes";
		//else
		//	document.getElementById("Simplified").innerHTML="No";
		//if (ResultFlagsVersion&0x20)//if there's a bit in the 2s place, ignoring first stuff
		//	document.getElementById("Handicapped").innerHTML="Yes";
		//else
		//	document.getElementById("Handicapped").innerHTML="No";
			
		
		var PackedSniperShots=dataView.getUint32(startIndex+4,true);//PackedSniperShots format
		if (PackedSniperShots&0x80000000){//if the Spy Shot Bit is true
			PackedSniperShots=PackedSniperShots-2147483648;//remove the ShotSpy bit
			
			if (PackedSniperShots==1)
				document.getElementById("SniperFileShotSpy").innerHTML="Yes, first shot";
			else
				document.getElementById("SniperFileShotSpy").innerHTML="Yes, eventually";
			
		}
		else
			document.getElementById("SniperFileShotSpy").innerHTML="Never, no";
		document.getElementById("SniperFileTotalShots").innerHTML=PackedSniperShots;
		
		
		SniperNewResult = dataView.getUint32(startIndex+8,true);//New Result
		switch (SniperNewResult) {
		  case 0:
			document.getElementById("SniperFileNewResult").innerHTML="Missions Win";
			break;
		  case 1:
			document.getElementById("SniperFileNewResult").innerHTML="Spy Timeout";
			break;
		  case 2:
			document.getElementById("SniperFileNewResult").innerHTML="Spy Shot";
			break;
		  case 3:
			document.getElementById("SniperFileNewResult").innerHTML="Civilian Shot";
			break;
		  case 4:
			document.getElementById("SniperFileNewResult").innerHTML="Result In Progress";
			break;
		  case 5:
			document.getElementById("SniperFileNewResult").innerHTML="Result Unknown";
			break;
		  case 6:
			document.getElementById("SniperFileNewResult").innerHTML="Lost to Sniper";
			break;
		  case 7:
			document.getElementById("SniperFileNewResult").innerHTML="Original Civilian Shot";
			break;
		  case 8: 
			document.getElementById("SniperFileNewResult").innerHTML="Replay Sniper Quit";
			break;
		  default:
			document.getElementById("SniperFileNewResult").innerHTML="ERROR HERE: "+SniperNewResult;
		}
		
		var AchievedMissionsBits = dataView.getUint32(startIndex+12, true);//Result_data: AchievedMissionsBits
		document.getElementById("SniperFileAchievedMissions").innerHTML=getMissionStringFromBits(AchievedMissionsBits);
		
		//end Result_data group
		
	}
	else{
		alert("Unexpected ResultData version: "+SniperResultFlagsVersionFinal+". Do not trust results File will not save.");
	}

}



function processResultData(startIndex){
	ResultFlagsVersion = dataView.getUint32(startIndex,true);//Result_data: FlagsVersion
	ResultFlagsVersionFinal=ResultFlagsVersion&0xf;// the top stuff is the version, everything else are flags.
	
	document.getElementById("ResultFlagsVersion").innerHTML="v"+ResultFlagsVersionFinal;
	
	if(ResultFlagsVersionFinal==3){
		
		//display extras = simplified or handicapped
		if (ResultFlagsVersion&0x10)//if there's a bit in the 1s place, ignoring first stuff
			document.getElementById("Simplified").innerHTML="Yes";
		else
			document.getElementById("Simplified").innerHTML="No";
		if (ResultFlagsVersion&0x20)//if there's a bit in the 2s place, ignoring first stuff
			document.getElementById("Handicapped").innerHTML="Yes";
		else
			document.getElementById("Handicapped").innerHTML="No";
			
		
		Result = dataView.getUint32(startIndex+4,true);//Result_data: Result
		switch (Result) {
		  case 0:
			document.getElementById("Result").innerHTML="Missions Win";
			break;
		  case 1:
			document.getElementById("Result").innerHTML="Spy Timeout";
			break;
		  case 2:
			document.getElementById("Result").innerHTML="Spy Shot";
			break;
		  case 3:
			document.getElementById("Result").innerHTML="Civilian Shot";
			break;
		  case 4:
			document.getElementById("Result").innerHTML="Result In Progress";
			break;
		  default:
			document.getElementById("Result").innerHTML="ERROR HERE: "+Result;
		}
		if(document.getElementById("ResultAutofill").checked)//if we're autofilling this
			document.getElementById("ResultNew").value=Result;
			
		var GameType = dataView.getUint8(startIndex+10);//Result_data: PackedGameType
		//why is this GameType at 62??
		//var GameType=0;//only care about high four bits?
		/*if (RawGameType>=128){
			RawGameType-=128;
			GameType+=8;
		}
		if (RawGameType>=64){
			RawGameType-=64;
			GameType+=4;
		}
		if (RawGameType>=32){
			RawGameType-=32;
			GameType+=2;
		}
		if (RawGameType>=16){
			RawGameType-=16;
			GameType+=1;
		}*///by now should have peeled off the top four bits?
		switch (GameType) {
		  case 0:
			document.getElementById("GameType").innerHTML="Known";//should be Any?
			break;
		  case 1:
			document.getElementById("GameType").innerHTML="Pick";
			break;
		  case 2:
			document.getElementById("GameType").innerHTML="Any";
			break;
		  default:
			document.getElementById("GameType").innerHTML="ERROR HERE: "+GameType;
		}
		
		var VenueHash = dataView.getUint32(startIndex+12,true);//Result_data: VenueHash (MapHash in checker's code)
		document.getElementById("VenueHash").innerHTML=VenueHash;//just display it raw I guess
		
		var VenueVariant = dataView.getUint32(startIndex+16,true);//Result_data: VenueVariant
		switch (VenueVariant) {
		  case 0:
			document.getElementById("VenueVariant").innerHTML="BooksBooksBooks";
			break;
		  case 1:
			document.getElementById("VenueVariant").innerHTML="BooksStatuesBooks";
			break;
		  case 2:
			document.getElementById("VenueVariant").innerHTML="StatuesBooksBooks";
			break;
		  case 3:
			document.getElementById("VenueVariant").innerHTML="StatuesStatuesBooks";
			break;
		  case 4:
			document.getElementById("VenueVariant").innerHTML="BooksBooksStatues";
			break;
		  case 5:
			document.getElementById("VenueVariant").innerHTML="BooksStatuesStatues";
			break;
		  case 6:
			document.getElementById("VenueVariant").innerHTML="StatuesBooksStatues";
			break;
		  case 7:
			document.getElementById("VenueVariant").innerHTML="StatuesStatuesStatues";
			break;
		  case 4294967295:
			document.getElementById("VenueVariant").innerHTML="No Variant";
			break;
		  default:
			document.getElementById("VenueVariant").innerHTML="Error here: "+VenueVariant;
		}

		var SelectedMissionsBits = dataView.getUint32(startIndex+20, true);//Result_data: SelectedMissionsBits
		document.getElementById("SelectedMissions").innerHTML=getMissionStringFromBits(SelectedMissionsBits);
		
		var EnabledMissionsBits = dataView.getUint32(startIndex+24, true);//Result_data: EnabledMissionsBits
		document.getElementById("EnabledMissions").innerHTML=getMissionStringFromBits(EnabledMissionsBits);
		
		var AchievedMissionsBits = dataView.getUint32(startIndex+28, true);//Result_data: AchievedMissionsBits
		document.getElementById("FinishedMissions").innerHTML=getMissionStringFromBits(AchievedMissionsBits);
		
		var NumGuests = dataView.getUint32(startIndex+32,true);//Result_data: NumGuests
		document.getElementById("NumGuests").innerHTML=NumGuests;
		
		var StartDurationSeconds = dataView.getUint32(startIndex+36,true);//Result_data: StartDurationSeconds
		document.getElementById("StartDurationSeconds").innerHTML=StartDurationSeconds;
		//end Result_data group
		
	}
	else{
		alert("Unexpected ResultData version: "+ResultFlagsVersionFinal+". Do not trust results File will not save.");
	}
	
}

	


//stolen from stackoverflow
function Utf8ArrayToStr(array) {
    var out, i, len, c;
    var char2, char3;

    out = "";
    len = array.length;
    i = 0;
    while(i < len) {
    c = array[i++];
    switch(c >> 4)
    { 
      case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12: case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(((c & 0x0F) << 12) |
                       ((char2 & 0x3F) << 6) |
                       ((char3 & 0x3F) << 0));
        break;
    }
    }

    return out;
}


// taken from github 
function encodeUTF8(s) {//returns Uint8Array
	var i = 0, bytes = new Uint8Array(s.length * 4);
	for (var ci = 0; ci != s.length; ci++) {
		var c = s.charCodeAt(ci);
		if (c < 128) {
			bytes[i++] = c;
			continue;
		}
		if (c < 2048) {
			bytes[i++] = c >> 6 | 192;
		} else {
			if (c > 0xd7ff && c < 0xdc00) {
				if (++ci >= s.length)
					throw new Error('UTF-8 encode: incomplete surrogate pair');
				var c2 = s.charCodeAt(ci);
				if (c2 < 0xdc00 || c2 > 0xdfff)
					throw new Error('UTF-8 encode: second surrogate character 0x' + c2.toString(16) + ' at index ' + ci + ' out of range');
				c = 0x10000 + ((c & 0x03ff) << 10) + (c2 & 0x03ff);
				bytes[i++] = c >> 18 | 240;
				bytes[i++] = c >> 12 & 63 | 128;
			} else bytes[i++] = c >> 12 | 224;
			bytes[i++] = c >> 6 & 63 | 128;
		}
		bytes[i++] = c & 63 | 128;
	}
	return bytes.subarray(0, i);
}

function wipeDataDisplay(){
	
	
	//hide all elements
	document.getElementById("SniperFileHideable").style.display = 'none';
	document.getElementById("ReplayFileHideable").style.display = 'none';
	
	wipeDataDisplayManual();
	
}
function wipeDataDisplayManual(){
	//sniper file
	document.getElementById("SniperFileVersion").innerHTML="null";
	document.getElementById("SniperP2PProtocolVersion").innerHTML="null";
	document.getElementById("SniperRevnoVersion").innerHTML="null";
	document.getElementById("SniperChangelistVersion").innerHTML="null";
	document.getElementById("SniperGameID").innerHTML="null";
	document.getElementById("SniperInstanceID").innerHTML="null";
	document.getElementById("SniperStartTime").innerHTML="null";
	document.getElementById("SniperPlayID").innerHTML="null";
	document.getElementById("SniperFlags").innerHTML="null";
	document.getElementById("SniperFileUsernameLength").innerHTML="null";
	document.getElementById("SniperFileDisplayNameLength").innerHTML="null";
	document.getElementById("SniperClientLatency").innerHTML="null";
	document.getElementById("SniperDuration").innerHTML="null";
	document.getElementById("SniperTotalDuration").innerHTML="null";
	document.getElementById("SniperPacketDataSize").innerHTML="null";
	document.getElementById("SniperResultFlagsVersion").innerHTML="null";
	document.getElementById("SniperFileShotSpy").innerHTML="null";
	document.getElementById("SniperFileTotalShots").innerHTML="null";
	document.getElementById("SniperFileNewResult").innerHTML="null";
	document.getElementById("SniperFileAchievedMissions").innerHTML="null";
	document.getElementById("SniperFileName").innerHTML="null";
	document.getElementById("SniperFileDisplayName").innerHTML="null";

	if(!document.getElementById("SniperStartTimeKeep").checked){//if we want to wipe the textbox
		document.getElementById("SniperStartTimeNew").value="";
		document.getElementById("SniperUnixTimeDisplay").innerHTML="";
	}
	if(!document.getElementById("SniperFileNameKeep").checked)//if we want to wipe the textbox
		document.getElementById("SniperFileNameNew").value="";
	if(!document.getElementById("SniperFileDisplayNameKeep").checked)//if we want to wipe the textbox
		document.getElementById("SniperFileDisplayNameNew").value="";
	
	
	
	
	//replays
	document.getElementById("ReplayFileVersion").innerHTML="null";
	document.getElementById("P2PProtocolVersion").innerHTML="null";
	document.getElementById("RevnoVersion").innerHTML="null";
	document.getElementById("ChangelistVersion").innerHTML="null";
	document.getElementById("Flags").innerHTML="null";
	document.getElementById("Duration").innerHTML="null";
	document.getElementById("GameID").innerHTML="null";
	document.getElementById("StartTime").innerHTML="null";
	document.getElementById("DurationDisplay").innerHTML="";
	document.getElementById("PlayID").innerHTML="null";
	document.getElementById("SpyUsernameLength").innerHTML="null";
	document.getElementById("SniperUsernameLength").innerHTML="null";
	document.getElementById("SpyDisplayNameLength").innerHTML="null";
	document.getElementById("SniperDisplayNameLength").innerHTML="null";
	document.getElementById("ClientLatency").innerHTML="null";
	document.getElementById("PacketDataSize").innerHTML="null";
	document.getElementById("SpyName").innerHTML="null";
	document.getElementById("SniperName").innerHTML="null";
	document.getElementById("SpyDisplayName").innerHTML="null";
	document.getElementById("SniperDisplayName").innerHTML="null";
	
	//result stuff
	document.getElementById("ResultFlagsVersion").innerHTML="null";
	document.getElementById("Simplified").innerHTML="null";
	document.getElementById("Handicapped").innerHTML="null";
	document.getElementById("Result").innerHTML="null";
	document.getElementById("GameType").innerHTML="null";
	document.getElementById("VenueHash").innerHTML="null";
	document.getElementById("VenueVariant").innerHTML="null";
	document.getElementById("SelectedMissions").innerHTML="null";
	document.getElementById("EnabledMissions").innerHTML="null";
	document.getElementById("FinishedMissions").innerHTML="null";
	document.getElementById("NumGuests").innerHTML="null";
	document.getElementById("StartDurationSeconds").innerHTML="null";
	
	
	if(!document.getElementById("DurationKeep").checked){//if we want to wipe the textbox
		document.getElementById("DurationNew").value="";
		document.getElementById("DurationTimeDisplay").innerHTML="";
	}
	if(!document.getElementById("StartTimeKeep").checked){//if we want to wipe the textbox
		document.getElementById("StartTimeNew").value="";
		document.getElementById("UnixTimeDisplay").innerHTML="";
	}
		
	if(!document.getElementById("SpyNameKeep").checked)//if we want to wipe the textbox
		document.getElementById("SpyNameNew").value="";
	if(!document.getElementById("SniperNameKeep").checked)//if we want to wipe the textbox
		document.getElementById("SniperNameNew").value="";
	if(!document.getElementById("SpyDisplayNameKeep").checked)//if we want to wipe the textbox
		document.getElementById("SpyDisplayNameNew").value="";
	if(!document.getElementById("SniperDisplayNameKeep").checked)//if we want to wipe the textbox
		document.getElementById("SniperDisplayNameNew").value="";
	
	if(!document.getElementById("ResultKeep").checked)//if we want to wipe the textbox
		document.getElementById("ResultNew").value="";
		
	//wipe global variables
	
	SniperFileVersion=-1
	SniperFileName="";
	SniperFileDisplayName="";
	SniperResultFlagsVersion=-1;
	SniperResultFlagsVersionFinal=-1;
	SniperNewResult=-1;
	ogSniperNameSize=-1;
	SniperStartTime=-1;
	
	
	
	ReplayFileVersion=-1;
	Duration=-1;
	StartTime=-1;
	Result=-1;
	
	SpyName="";
	SniperName="";
	SpyDisplayName="";
	SniperDisplayName="";
	
	
	BaseNameIndex=-1;
	
	//just noticed ogNameSize isn't wiped, hopefully this doesn't break anything
	ogNameSize=-1;
	
	
	isReplay=false;
	isSniper=false;
	
}


function getMissionStringFromBits(input){
	var stringBuilder="";
	
	if(input%2==1){
		input-=1;
		stringBuilder+="Bug Ambassador, ";
	}
	if(input%4==2){
		input-=2;
		stringBuilder+="Contact Double Agent, ";
	}
	if(input%8==4){
		input-=4;
		stringBuilder+="Transfer Microfilm, ";
	}
	if(input%16==8){
		input-=8;
		stringBuilder+="Swap Statue, ";
	}
	if(input%32==16){
		input-=16;
		stringBuilder+="Inspect Statue, ";
	}
	if(input%64==32){
		input-=32;
		stringBuilder+="Seduce Target, ";
	}
	if(input%128==64){
		input-=64;
		stringBuilder+="Purloin Guestlist, ";
	}
	if(input>=128){
		stringBuilder+="Fingerprint Ambassador, ";
	}
	
	stringBuilder=stringBuilder.slice(0, -2);//remove the last two characters (comma, space)
	
	if (stringBuilder.length==0)
		stringBuilder="[None]";
	return stringBuilder;
}


function saveToFile(){
	
	if(firstReplayLoad){//if we haven't loaded a replay yet
		alert("You haven't loaded a replay yet.");
	}
	else if(ReplayFileVersion==6 && (ResultFlagsVersionFinal)==3){
		//if duration has changed.  do I have to do a better comparison? 
		if (Duration.toFixed(5) != parseFloat(document.getElementById("DurationNew").value).toFixed(5)){
			if (document.getElementById("DurationNew").value.length>0)//make sure the text field isn't empty
				dataView.setFloat32(20,parseFloat(document.getElementById("DurationNew").value),true);
			else//text field is empty, assume they want to write?
				dataView.setFloat32(20,parseFloat(0),true);
			
			
		}
		
		//if StartTime has changed.
		if (StartTime != parseInt(document.getElementById("StartTimeNew").value)){ 
			if (document.getElementById("StartTimeNew").value.length>0)//make sure the text field isn't empty
				dataView.setUint32(40,parseInt(document.getElementById("StartTimeNew").value),true);//StartTime
			else//text field is empty, assume they want to write?
				dataView.setUint32(40,0,true);//StartTime
		}
		
		
		
		
			//if Result has changed.
			if (Result != parseInt(document.getElementById("ResultNew").value)){ 
				if (document.getElementById("ResultNew").value.length>0)//make sure the text field isn't empty
					dataView.setUint32(56,parseInt(document.getElementById("ResultNew").value),true);//StartTime
				else//text field is empty, assume they want to write?
					dataView.setUint32(56,0,true);//StartTime
			}
		
		
		//that's all the easy stuff
		
		//calculate the total size difference of adjusted names
		var sizeChange=ogNameSize-(document.getElementById("SpyNameNew").value.length+document.getElementById("SniperNameNew").value.length+document.getElementById("SpyDisplayNameNew").value.length+document.getElementById("SniperDisplayNameNew").value.length);
		//if this is positive, old names are larger than new names, so must shrink. or vice versa.  possibly don't even need this after this point?
		
		//find out if we are changing names.
		if(sizeChange !=0 || SpyName != document.getElementById("SpyNameNew").value || SniperName != document.getElementById("SniperNameNew").value || SpyDisplayName != document.getElementById("SpyDisplayNameNew").value || SniperDisplayName != document.getElementById("SniperDisplayNameNew").value)
		{
			//alert("we are changing names");
			
			//write all new name lengths before converting to more annoying formats
			dataView.setUint8(46,parseInt(document.getElementById("SpyNameNew").value.length));//SpyUsernameLength
			dataView.setUint8(47,parseInt(document.getElementById("SniperNameNew").value.length));//SniperUsernameLength
			dataView.setUint8(48,parseInt(document.getElementById("SpyDisplayNameNew").value.length));//SpyDisplayNameLength
			dataView.setUint8(49,parseInt(document.getElementById("SniperDisplayNameNew").value.length));//SniperDisplayNameLength
			
			//realized slightly too late it would be convenient to store new name lengths to be written
			var NewSpyLength=document.getElementById("SpyNameNew").value.length;
			var NewSniperLength=document.getElementById("SniperNameNew").value.length;
			var NewSpyDisplayLength=document.getElementById("SpyDisplayNameNew").value.length;
			//var NewSniperDisplayLength=document.getElementById("SniperDisplayNameNew").value.length; // I don't think I need this since I wrote most of the code without these, and am only using them for adding index for later name changes
			
			//oh hey annoying format
			var tempDataArray = Array.from(new Uint8Array(ogFileBuffer));//convert to normal array of Uint8s, where we have more functions
			BaseNameIndex=100;
			
			//set spy name
			if (SpyName != document.getElementById("SpyNameNew").value){//figure out if we need to write new Name
				var newName=encodeUTF8(document.getElementById("SpyNameNew").value);//outputs Uint8Array
				
				//calculate if this name is getting longer or shorter, remove/add from array as necessary
				if ( SpyName.length < newName.length){//new name is bigger than old name
					var i;//keep index after for loop
					for(i=0;i<SpyName.length;i++){//overwrite all letters of old name
						tempDataArray[BaseNameIndex+i]=newName[i];
					}
					var toAdd = newName.length - SpyName.length;//number to add
					
					for(j=0;j<toAdd;j++){
						tempDataArray.splice(BaseNameIndex+i+j,0,newName[i+j]);
					}
				}
				else if ( SpyName.length > newName.length){//new name is smaller
					var i;//keep index after for loop
					for(i=0;i<newName.length;i++){//set all letters of new name
						tempDataArray[BaseNameIndex+i]=newName[i];
					}
					var toRemove = SpyName.length - newName.length;
					tempDataArray.splice(BaseNameIndex+i,toRemove);//remove #toRemove elements, starting at position i
				}
				else{//else the names are the same length, but still different.  write
					for(i=0;i<newName.length;i++){
						tempDataArray[BaseNameIndex+i]=newName[i];
					}
				}
				
				//if bulk is enabled, save name pairs
				if (document.getElementById("nameBulk").checked){
					//test if current spy name is in our list already
					if(containsObject(SpyName,originalPlayerName)==-1){//don't write empty strings?  && document.getElementById("SpyNameNew").value.length!=0
						//if here, then originalPlayerName does NOT contain original spy name, so need to write it and pair.
						originalPlayerName.push(SpyName);
						newPlayerName.push(document.getElementById("SpyNameNew").value);
					}
				}
				
				
			}//done with spy name
			
			
			//set sniper name
			if (SniperName != document.getElementById("SniperNameNew").value){//figure out if we need to write new Name
				var newName=encodeUTF8(document.getElementById("SniperNameNew").value);//outputs Uint8Array
				
				//calculate if this name is getting longer or shorter, remove/add from array as necessary
				if ( SniperName.length < newName.length){//new name is bigger than old name
					var i;//keep index after for loop
					for(i=0;i<SniperName.length;i++){//overwrite all letters of old name
						tempDataArray[BaseNameIndex+NewSpyLength+i]=newName[i];
					}
					var toAdd = newName.length - SniperName.length;//number to add
					
					for(j=0;j<toAdd;j++){
						tempDataArray.splice(BaseNameIndex+NewSpyLength+i+j,0,newName[i+j]);
					}
				}
				else if ( SniperName.length > newName.length){//new name is smaller
					var i;//keep index after for loop
					for(i=0;i<newName.length;i++){//set all letters of new name
						tempDataArray[BaseNameIndex+NewSpyLength+i]=newName[i];
					}
					var toRemove = SniperName.length - newName.length;
					tempDataArray.splice(BaseNameIndex+NewSpyLength+i,toRemove);//remove #toRemove elements, starting at position i
				}
				else{//else the names are the same length, but still different.  write
					for(i=0;i<newName.length;i++){
						tempDataArray[BaseNameIndex+NewSpyLength+i]=newName[i];
					}
				}
				
				
				//if bulk is enabled, save name pairs
				if (document.getElementById("nameBulk").checked){
					//test if current sniper name is in our list already
					if(containsObject(SniperName,originalPlayerName)==-1){//don't write empty strings?  && document.getElementById("SniperNameNew").value.length!=0
						//if here, then originalPlayerName does NOT contain original sniper name, so need to write it and pair.
						originalPlayerName.push(SniperName);
						newPlayerName.push(document.getElementById("SniperNameNew").value);
					}
				}
			
			}//done with sniper name
			
			
			
			//set spy display name
			if (SpyDisplayName != document.getElementById("SpyDisplayNameNew").value  && SpyDisplayName.length>0){//figure out if we need to write new Name
				var newName=encodeUTF8(document.getElementById("SpyDisplayNameNew").value);//outputs Uint8Array
				
				//calculate if this name is getting longer or shorter, remove/add from array as necessary
				if ( SpyDisplayName.length < newName.length){//new name is bigger than old name
					var i;//keep index after for loop
					for(i=0;i<SpyDisplayName.length;i++){//overwrite all letters of old name
						tempDataArray[BaseNameIndex+NewSpyLength+NewSniperLength+i]=newName[i];
					}
					var toAdd = newName.length - SpyDisplayName.length;//number to add
					
					for(j=0;j<toAdd;j++){
						tempDataArray.splice(BaseNameIndex+NewSpyLength+NewSniperLength+i+j,0,newName[i+j]);
					}
				}
				else if ( SpyDisplayName.length > newName.length){//new name is smaller
					var i;//keep index after for loop
					for(i=0;i<newName.length;i++){//set all letters of new name
						tempDataArray[BaseNameIndex+NewSpyLength+NewSniperLength+i]=newName[i];
					}
					var toRemove = SpyDisplayName.length - newName.length;
					tempDataArray.splice(BaseNameIndex+NewSpyLength+NewSniperLength+i,toRemove);//remove #toRemove elements, starting at position i
				}
				else{//else the names are the same length, but still different.  write
					for(i=0;i<newName.length;i++){
						tempDataArray[BaseNameIndex+NewSpyLength+NewSniperLength+i]=newName[i];
					}
				}
				
				
				
				//if bulk is enabled, save name pairs
				if (document.getElementById("nameBulk").checked){
					//test if current spy name is in our list already
					if(containsObject(SpyDisplayName,originalPlayerName)==-1){//don't write empty strings?   && document.getElementById("SpyDisplayNameNew").value.length!=0
						//if here, then originalPlayerName does NOT contain original spy name, so need to write it and pair.
						originalPlayerName.push(SpyDisplayName);
						newPlayerName.push(document.getElementById("SpyDisplayNameNew").value);
						//alert("saving steam name1");
					}
				}
			}//done with spy display name
			
			
			//set sniper display name
			if (SniperDisplayName != document.getElementById("SniperDisplayNameNew").value){//figure out if we need to write new Name
				var newName=encodeUTF8(document.getElementById("SniperDisplayNameNew").value);//outputs Uint8Array
				
				//calculate if this name is getting longer or shorter, remove/add from array as necessary
				if ( SniperDisplayName.length < newName.length){//new name is bigger than old name
					var i;//keep index after for loop
					for(i=0;i<SniperDisplayName.length;i++){//overwrite all letters of old name
						tempDataArray[BaseNameIndex+NewSpyLength+NewSniperLength+NewSpyDisplayLength+i]=newName[i];
					}
					var toAdd = newName.length - SniperDisplayName.length;//number to add
					
					for(j=0;j<toAdd;j++){
						tempDataArray.splice(BaseNameIndex+NewSpyLength+NewSniperLength+NewSpyDisplayLength+i+j,0,newName[i+j]);
					}
				}
				else if ( SniperDisplayName.length > newName.length){//new name is smaller
					var i;//keep index after for loop
					for(i=0;i<newName.length;i++){//set all letters of new name
						tempDataArray[BaseNameIndex+NewSpyLength+NewSniperLength+NewSpyDisplayLength+i]=newName[i];
					}
					var toRemove = SniperDisplayName.length - newName.length;
					tempDataArray.splice(BaseNameIndex+NewSpyLength+NewSniperLength+NewSpyDisplayLength+i,toRemove);//remove #toRemove elements, starting at position i
				}
				else{//else the names are the same length, but still different.  write
					for(i=0;i<newName.length;i++){
						tempDataArray[BaseNameIndex+NewSpyLength+NewSniperLength+NewSpyDisplayLength+i]=newName[i];
					}
				}
				
				
				//if bulk is enabled, save name pairs
				if (document.getElementById("nameBulk").checked && SniperDisplayName.length>0){
					//test if current sniper name is in our list already
					if(containsObject(SniperDisplayName,originalPlayerName)==-1){//don't write empty strings?  && document.getElementById("SniperDisplayNameNew").value.length!=0
						//if here, then originalPlayerName does NOT contain original sniper name, so need to write it and pair.
						originalPlayerName.push(SniperDisplayName);
						newPlayerName.push(document.getElementById("SniperDisplayNameNew").value);
						//alert("saving steam name2");
					}
				}
				
				
			}//done with sniper display name
			
			
			
			
			//finally, write tempDataArray to file? or convert to buffer?
			//convert back to typed array, of fixed [new] length
			var outputArray=new Uint8Array(tempDataArray);
			
			
			//propose file
			var file = new Blob([outputArray], {type: "application/octet-stream;charset=utf-8"});
			var a = document.createElement("a"), url = URL.createObjectURL(file);
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			
			fileQueue--;
			if(fileQueue>0)
				loadNextFile();
			else if (fileQueuePos > 0)
				alert("End of queue, no file loaded");
			
		}
		else{//if we don't need to write names, just throw the file back out
			//propose file
			var file = new Blob([ogFileBuffer], {type: "application/octet-stream;charset=utf-8"});
			var a = document.createElement("a"), url = URL.createObjectURL(file);
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			
			fileQueue--;
			if(fileQueue>0)
				loadNextFile();
			else if (fileQueuePos > 0)
				alert("End of queue, no file loaded");
		}
		
		
		
		
		
	}
	else if(ReplayFileVersion==7 && (ResultFlagsVersionFinal)==3){
		//if duration has changed.  do I have to do a better comparison? 
		if (Duration.toFixed(5) != parseFloat(document.getElementById("DurationNew").value).toFixed(5)){
			if (document.getElementById("DurationNew").value.length>0)//make sure the text field isn't empty
				dataView.setFloat32(24,parseFloat(document.getElementById("DurationNew").value),true);
			else//text field is empty, assume they want to write?
				dataView.setFloat32(24,parseFloat(0),true);
			
			
		}
		
		//if StartTime has changed.
		if (StartTime != parseInt(document.getElementById("StartTimeNew").value)){ 
			if (document.getElementById("StartTimeNew").value.length>0)//make sure the text field isn't empty
				dataView.setUint32(44,parseInt(document.getElementById("StartTimeNew").value),true);//StartTime
			else//text field is empty, assume they want to write?
				dataView.setUint32(44,0,true);//StartTime
		}
		
		
		//if Result has changed.
		if (Result != parseInt(document.getElementById("ResultNew").value)){ 
			if (document.getElementById("ResultNew").value.length>0)//make sure the text field isn't empty
				dataView.setUint32(60,parseInt(document.getElementById("ResultNew").value),true);//StartTime
			else//text field is empty, assume they want to write?
				dataView.setUint32(60,0,true);//StartTime
		}
		
		
		//that's all the easy stuff
		
		
		//calculate the total size difference of adjusted names
		var sizeChange=ogNameSize-(document.getElementById("SpyNameNew").value.length+document.getElementById("SniperNameNew").value.length+document.getElementById("SpyDisplayNameNew").value.length+document.getElementById("SniperDisplayNameNew").value.length);
		//if this is positive, old names are larger than new names, so must shrink. or vice versa.  possibly don't even need this after this point?
		
		//find out if we are changing names.
		if(sizeChange !=0 || SpyName != document.getElementById("SpyNameNew").value || SniperName != document.getElementById("SniperNameNew").value || SpyDisplayName != document.getElementById("SpyDisplayNameNew").value || SniperDisplayName != document.getElementById("SniperDisplayNameNew").value)
		{
			//alert("we are changing names");
			
			//write all new name lengths before converting to more annoying formats
			dataView.setUint8(50,parseInt(document.getElementById("SpyNameNew").value.length));//SpyUsernameLength
			dataView.setUint8(51,parseInt(document.getElementById("SniperNameNew").value.length));//SniperUsernameLength
			dataView.setUint8(52,parseInt(document.getElementById("SpyDisplayNameNew").value.length));//SpyDisplayNameLength
			dataView.setUint8(53,parseInt(document.getElementById("SniperDisplayNameNew").value.length));//SniperDisplayNameLength
			
			//realized slightly too late it would be convenient to store new name lengths to be written
			var NewSpyLength=document.getElementById("SpyNameNew").value.length;
			var NewSniperLength=document.getElementById("SniperNameNew").value.length;
			var NewSpyDisplayLength=document.getElementById("SpyDisplayNameNew").value.length;
			//var NewSniperDisplayLength=document.getElementById("SniperDisplayNameNew").value.length; // I don't think I need this since I wrote most of the code without these, and am only using them for adding index for later name changes
			
			//oh hey annoying format
			var tempDataArray = Array.from(new Uint8Array(ogFileBuffer));//convert to normal array of Uint8s, where we have more functions
			BaseNameIndex=104;
			
			//set spy name
			if (SpyName != document.getElementById("SpyNameNew").value){//figure out if we need to write new Name
				var newName=encodeUTF8(document.getElementById("SpyNameNew").value);//outputs Uint8Array
				
				//calculate if this name is getting longer or shorter, remove/add from array as necessary
				if ( SpyName.length < newName.length){//new name is bigger than old name
					var i;//keep index after for loop
					for(i=0;i<SpyName.length;i++){//overwrite all letters of old name
						tempDataArray[BaseNameIndex+i]=newName[i];
					}
					var toAdd = newName.length - SpyName.length;//number to add
					
					for(j=0;j<toAdd;j++){
						tempDataArray.splice(BaseNameIndex+i+j,0,newName[i+j]);
					}
				}
				else if ( SpyName.length > newName.length){//new name is smaller
					var i;//keep index after for loop
					for(i=0;i<newName.length;i++){//set all letters of new name
						tempDataArray[BaseNameIndex+i]=newName[i];
					}
					var toRemove = SpyName.length - newName.length;
					tempDataArray.splice(BaseNameIndex+i,toRemove);//remove #toRemove elements, starting at position i
				}
				else{//else the names are the same length, but still different.  write
					for(i=0;i<newName.length;i++){
						tempDataArray[BaseNameIndex+i]=newName[i];
					}
				}
				
				//if bulk is enabled, save name pairs
				if (document.getElementById("nameBulk").checked){
					//test if current spy name is in our list already
					if(containsObject(SpyName,originalPlayerName)==-1){//don't write empty strings?  && document.getElementById("SpyNameNew").value.length!=0
						//if here, then originalPlayerName does NOT contain original spy name, so need to write it and pair.
						originalPlayerName.push(SpyName);
						newPlayerName.push(document.getElementById("SpyNameNew").value);
					}
				}
				
				
			}//done with spy name
			
			
			//set sniper name
			if (SniperName != document.getElementById("SniperNameNew").value){//figure out if we need to write new Name
				var newName=encodeUTF8(document.getElementById("SniperNameNew").value);//outputs Uint8Array
				
				//calculate if this name is getting longer or shorter, remove/add from array as necessary
				if ( SniperName.length < newName.length){//new name is bigger than old name
					var i;//keep index after for loop
					for(i=0;i<SniperName.length;i++){//overwrite all letters of old name
						tempDataArray[BaseNameIndex+NewSpyLength+i]=newName[i];
					}
					var toAdd = newName.length - SniperName.length;//number to add
					
					for(j=0;j<toAdd;j++){
						tempDataArray.splice(BaseNameIndex+NewSpyLength+i+j,0,newName[i+j]);
					}
				}
				else if ( SniperName.length > newName.length){//new name is smaller
					var i;//keep index after for loop
					for(i=0;i<newName.length;i++){//set all letters of new name
						tempDataArray[BaseNameIndex+NewSpyLength+i]=newName[i];
					}
					var toRemove = SniperName.length - newName.length;
					tempDataArray.splice(BaseNameIndex+NewSpyLength+i,toRemove);//remove #toRemove elements, starting at position i
				}
				else{//else the names are the same length, but still different.  write
					for(i=0;i<newName.length;i++){
						tempDataArray[BaseNameIndex+NewSpyLength+i]=newName[i];
					}
				}
				
				
				//if bulk is enabled, save name pairs
				if (document.getElementById("nameBulk").checked){
					//test if current sniper name is in our list already
					if(containsObject(SniperName,originalPlayerName)==-1){//don't write empty strings?  && document.getElementById("SniperNameNew").value.length!=0
						//if here, then originalPlayerName does NOT contain original sniper name, so need to write it and pair.
						originalPlayerName.push(SniperName);
						newPlayerName.push(document.getElementById("SniperNameNew").value);
					}
				}
			
			}//done with sniper name
			
			
			
			//set spy display name
			if (SpyDisplayName != document.getElementById("SpyDisplayNameNew").value  && SpyDisplayName.length>0){//figure out if we need to write new Name
				var newName=encodeUTF8(document.getElementById("SpyDisplayNameNew").value);//outputs Uint8Array
				
				//calculate if this name is getting longer or shorter, remove/add from array as necessary
				if ( SpyDisplayName.length < newName.length){//new name is bigger than old name
					var i;//keep index after for loop
					for(i=0;i<SpyDisplayName.length;i++){//overwrite all letters of old name
						tempDataArray[BaseNameIndex+NewSpyLength+NewSniperLength+i]=newName[i];
					}
					var toAdd = newName.length - SpyDisplayName.length;//number to add
					
					for(j=0;j<toAdd;j++){
						tempDataArray.splice(BaseNameIndex+NewSpyLength+NewSniperLength+i+j,0,newName[i+j]);
					}
				}
				else if ( SpyDisplayName.length > newName.length){//new name is smaller
					var i;//keep index after for loop
					for(i=0;i<newName.length;i++){//set all letters of new name
						tempDataArray[BaseNameIndex+NewSpyLength+NewSniperLength+i]=newName[i];
					}
					var toRemove = SpyDisplayName.length - newName.length;
					tempDataArray.splice(BaseNameIndex+NewSpyLength+NewSniperLength+i,toRemove);//remove #toRemove elements, starting at position i
				}
				else{//else the names are the same length, but still different.  write
					for(i=0;i<newName.length;i++){
						tempDataArray[BaseNameIndex+NewSpyLength+NewSniperLength+i]=newName[i];
					}
				}
				
				
				
				//if bulk is enabled, save name pairs
				if (document.getElementById("nameBulk").checked){
					//test if current spy name is in our list already
					if(containsObject(SpyDisplayName,originalPlayerName)==-1){//don't write empty strings?   && document.getElementById("SpyDisplayNameNew").value.length!=0
						//if here, then originalPlayerName does NOT contain original spy name, so need to write it and pair.
						originalPlayerName.push(SpyDisplayName);
						newPlayerName.push(document.getElementById("SpyDisplayNameNew").value);
						//alert("saving steam name1");
					}
				}
			}//done with spy display name
			
			
			//set sniper display name
			if (SniperDisplayName != document.getElementById("SniperDisplayNameNew").value){//figure out if we need to write new Name
				var newName=encodeUTF8(document.getElementById("SniperDisplayNameNew").value);//outputs Uint8Array
				
				//calculate if this name is getting longer or shorter, remove/add from array as necessary
				if ( SniperDisplayName.length < newName.length){//new name is bigger than old name
					var i;//keep index after for loop
					for(i=0;i<SniperDisplayName.length;i++){//overwrite all letters of old name
						tempDataArray[BaseNameIndex+NewSpyLength+NewSniperLength+NewSpyDisplayLength+i]=newName[i];
					}
					var toAdd = newName.length - SniperDisplayName.length;//number to add
					
					for(j=0;j<toAdd;j++){
						tempDataArray.splice(BaseNameIndex+NewSpyLength+NewSniperLength+NewSpyDisplayLength+i+j,0,newName[i+j]);
					}
				}
				else if ( SniperDisplayName.length > newName.length){//new name is smaller
					var i;//keep index after for loop
					for(i=0;i<newName.length;i++){//set all letters of new name
						tempDataArray[BaseNameIndex+NewSpyLength+NewSniperLength+NewSpyDisplayLength+i]=newName[i];
					}
					var toRemove = SniperDisplayName.length - newName.length;
					tempDataArray.splice(BaseNameIndex+NewSpyLength+NewSniperLength+NewSpyDisplayLength+i,toRemove);//remove #toRemove elements, starting at position i
				}
				else{//else the names are the same length, but still different.  write
					for(i=0;i<newName.length;i++){
						tempDataArray[BaseNameIndex+NewSpyLength+NewSniperLength+NewSpyDisplayLength+i]=newName[i];
					}
				}
				
				
				//if bulk is enabled, save name pairs
				if (document.getElementById("nameBulk").checked && SniperDisplayName.length>0){
					//test if current sniper name is in our list already
					if(containsObject(SniperDisplayName,originalPlayerName)==-1){//don't write empty strings?  && document.getElementById("SniperDisplayNameNew").value.length!=0
						//if here, then originalPlayerName does NOT contain original sniper name, so need to write it and pair.
						originalPlayerName.push(SniperDisplayName);
						newPlayerName.push(document.getElementById("SniperDisplayNameNew").value);
						//alert("saving steam name2");
					}
				}
				
				
			}//done with sniper display name
			
			
			
			
			//finally, write tempDataArray to file? or convert to buffer?
			//convert back to typed array, of fixed [new] length
			var outputArray=new Uint8Array(tempDataArray);
			
			
			//propose file
			var file = new Blob([outputArray], {type: "application/octet-stream;charset=utf-8"});
			var a = document.createElement("a"), url = URL.createObjectURL(file);
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			
			fileQueue--;
			if(fileQueue>0)
				loadNextFile();
			else if (fileQueuePos > 0)
				alert("End of queue, no file loaded");
			
		}
		else{//if we don't need to write names, just throw the file back out
			//propose file
			var file = new Blob([ogFileBuffer], {type: "application/octet-stream;charset=utf-8"});
			var a = document.createElement("a"), url = URL.createObjectURL(file);
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			
			fileQueue--;
			if(fileQueue>0)
				loadNextFile();
			else if (fileQueuePos > 0)
				alert("End of queue, no file loaded");
		}
		
		
		
		
		
	}
	else if (SniperFileVersion==6 && (SniperResultFlagsVersionFinal)==2){
		
		
		//if StartTime has changed.
		if (SniperStartTime != parseInt(document.getElementById("SniperStartTimeNew").value)){ 
			if (document.getElementById("SniperStartTimeNew").value.length>0)//make sure the text field isn't empty
				dataView.setUint32(52,parseInt(document.getElementById("SniperStartTimeNew").value),true);//StartTime
			else//text field is empty, assume they want to write?
				dataView.setUint32(52,0,true);//StartTime
		}

		//that's all the easy stuff
		
		
		//calculate the total size difference of adjusted names
		var sizeChange=ogSniperNameSize-(document.getElementById("SniperFileNameNew").value.length+document.getElementById("SniperFileDisplayNameNew").value.length);
		//if this is positive, old names are larger than new names, so must shrink. or vice versa.  possibly don't even need this after this point?
		
		//find out if we are changing names.
		if(sizeChange !=0 || SniperFileName != document.getElementById("SniperFileNameNew").value || SniperFileDisplayName != document.getElementById("SniperFileDisplayNameNew").value)
		{
			//alert("we are changing names");
			
			//write all new name lengths before converting to more annoying formats
			dataView.setUint8(59,parseInt(document.getElementById("SniperFileNameNew").value.length));//SniperUsernameLength
			dataView.setUint8(60,parseInt(document.getElementById("SniperFileDisplayNameNew").value.length));//SniperDisplayNameLength
			
			//realized slightly too late it would be convenient to store new name lengths to be written
			var NewSniperLength=document.getElementById("SniperFileNameNew").value.length;
			//var NewSniperDisplayLength=document.getElementById("SniperDisplayNameNew").value.length; // I don't think I need this since I wrote most of the code without these, and am only using them for adding index for later name changes
			
			//oh hey annoying format
			var tempDataArray = Array.from(new Uint8Array(ogFileBuffer));//convert to normal array of Uint8s, where we have more functions
			BaseNameIndex=96;
			
			
			//set sniper name
			if (SniperFileName != document.getElementById("SniperFileNameNew").value){//figure out if we need to write new Name
				var newName=encodeUTF8(document.getElementById("SniperFileNameNew").value);//outputs Uint8Array
				
				//calculate if this name is getting longer or shorter, remove/add from array as necessary
				if ( SniperFileName.length < newName.length){//new name is bigger than old name
					var i;//keep index after for loop
					for(i=0;i<SniperFileName.length;i++){//overwrite all letters of old name
						tempDataArray[BaseNameIndex+i]=newName[i];
					}
					var toAdd = newName.length - SniperName.length;//number to add
					
					for(j=0;j<toAdd;j++){
						tempDataArray.splice(BaseNameIndex+i+j,0,newName[i+j]);
					}
				}
				else if ( SniperFileName.length > newName.length){//new name is smaller
					var i;//keep index after for loop
					for(i=0;i<newName.length;i++){//set all letters of new name
						tempDataArray[BaseNameIndex+i]=newName[i];
					}
					var toRemove = SniperFileName.length - newName.length;
					tempDataArray.splice(BaseNameIndex+i,toRemove);//remove #toRemove elements, starting at position i
				}
				else{//else the names are the same length, but still different.  write
					for(i=0;i<newName.length;i++){
						tempDataArray[BaseNameIndex+i]=newName[i];
					}
				}
				
				
				//if bulk is enabled, save name pairs
				if (document.getElementById("nameBulk").checked){
					//test if current sniper name is in our list already
					if(containsObject(SniperFileName,originalPlayerName)==-1){//don't write empty strings?  && document.getElementById("SniperNameNew").value.length!=0
						//if here, then originalPlayerName does NOT contain original sniper name, so need to write it and pair.
						originalPlayerName.push(SniperFileName);
						newPlayerName.push(document.getElementById("SniperFileNameNew").value);
					}
				}
			
			}//done with sniper name
			
			
			//set sniper display name
			if (SniperFileDisplayName != document.getElementById("SniperFileDisplayNameNew").value){//figure out if we need to write new Name
				var newName=encodeUTF8(document.getElementById("SniperFileDisplayNameNew").value);//outputs Uint8Array
				
				//calculate if this name is getting longer or shorter, remove/add from array as necessary
				if ( SniperFileDisplayName.length < newName.length){//new name is bigger than old name
					var i;//keep index after for loop
					for(i=0;i<SniperFileDisplayName.length;i++){//overwrite all letters of old name
						tempDataArray[BaseNameIndex+NewSniperLength+i]=newName[i];
					}
					var toAdd = newName.length - SniperFileDisplayName.length;//number to add
					
					for(j=0;j<toAdd;j++){
						tempDataArray.splice(BaseNameIndex+NewSniperLength+i+j,0,newName[i+j]);
					}
				}
				else if ( SniperFileDisplayName.length > newName.length){//new name is smaller
					var i;//keep index after for loop
					for(i=0;i<newName.length;i++){//set all letters of new name
						tempDataArray[BaseNameIndex+NewSniperLength+i]=newName[i];
					}
					var toRemove = SniperFileDisplayName.length - newName.length;
					tempDataArray.splice(BaseNameIndex+NewSniperLength+i,toRemove);//remove #toRemove elements, starting at position i
				}
				else{//else the names are the same length, but still different.  write
					for(i=0;i<newName.length;i++){
						tempDataArray[BaseNameIndex+NewSniperLength+i]=newName[i];
					}
				}
				
				
				//if bulk is enabled, save name pairs
				if (document.getElementById("nameBulk").checked && SniperFileDisplayName.length>0){
					//test if current sniper name is in our list already
					if(containsObject(SniperFileDisplayName,originalPlayerName)==-1){//don't write empty strings?  && document.getElementById("SniperDisplayNameNew").value.length!=0
						//if here, then originalPlayerName does NOT contain original sniper name, so need to write it and pair.
						originalPlayerName.push(SniperFileDisplayName);
						newPlayerName.push(document.getElementById("SniperFileDisplayNameNew").value);
						//alert("saving steam name2");
					}
				}
				
				
			}//done with sniper display name
			
			
			
			
			//finally, write tempDataArray to file? or convert to buffer?
			//convert back to typed array, of fixed [new] length
			var outputArray=new Uint8Array(tempDataArray);
			
			
			//propose file
			var file = new Blob([outputArray], {type: "application/octet-stream;charset=utf-8"});
			var a = document.createElement("a"), url = URL.createObjectURL(file);
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			
			fileQueue--;
			if(fileQueue>0)
				loadNextFile();
			else if (fileQueuePos > 0)
				alert("End of queue, no file loaded");
			
		}
		else{//if we don't need to write names, just throw the file back out
			//propose file
			var file = new Blob([ogFileBuffer], {type: "application/octet-stream;charset=utf-8"});
			var a = document.createElement("a"), url = URL.createObjectURL(file);
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			
			fileQueue--;
			if(fileQueue>0)
				loadNextFile();
			else if (fileQueuePos > 0)
				alert("End of queue, no file loaded");
		}
		
		
	}
	else{
		if(isReplay)
			alert("This replay version or result data version not supported yet: "+ReplayFileVersion+", "+ResultFlagsVersionFinal);
		else if (isSniper)
			alert("This sniper version or result data version not supported yet: "+SniperFileVersion+", "+SniperResultFlagsVersionFinal);
		else
			alert("Something is unsupported and I don't know what. screenshot this and show me");
	}
	
}




function updateTime(elementID){
	var seconds;
	
	if(elementID=="StartDurationSeconds")//get seconds
		seconds=document.getElementById(elementID).innerHTML;
	else
		seconds=document.getElementById(elementID).value;
	
	
	var stringBuilder="(";
	var minutes = Math.floor(seconds/60);
	if (minutes<10)
		stringBuilder+="0";
	stringBuilder+=minutes+":";
	seconds=seconds - (minutes*60);
	if (seconds<10)
		stringBuilder+="0";
	stringBuilder+=seconds+")";
	
	//display
	if(elementID=="DurationNew")//grab another id
		document.getElementById("DurationTimeDisplay").innerHTML=stringBuilder;
	if(elementID=="StartDurationSeconds")//grab another id
		document.getElementById("DurationDisplay").innerHTML=stringBuilder;
		
}

//taken from stackoverflow
function displayUnixTime(){
	var a = new Date(document.getElementById("StartTimeNew").value * 1000);
	var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	var year = a.getFullYear();
	var month = months[a.getMonth()];
	var date = a.getDate();
	var hour = a.getHours();
	var min = a.getMinutes();
	var sec = a.getSeconds();
var time = '(' + month + ' ' + date + ', ' + year + ' ' + hour + ':' + min + ':' + sec + ')' ;
	
	
	document.getElementById("UnixTimeDisplay").innerHTML=time;
	
}
function displaySniperUnixTime(){
	var a = new Date(document.getElementById("SniperStartTimeNew").value * 1000);
	var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	var year = a.getFullYear();
	var month = months[a.getMonth()];
	var date = a.getDate();
	var hour = a.getHours();
	var min = a.getMinutes();
	var sec = a.getSeconds();
var time = '(' + month + ' ' + date + ', ' + year + ' ' + hour + ':' + min + ':' + sec + ')' ;
	
	
	document.getElementById("SniperUnixTimeDisplay").innerHTML=time;
	
}


function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i] == obj) {
            return i;
        }
    }

    return -1;
}




function loadNextFile(){
	fileQueuePos++;
	
	alert("Attempting load of next replay. #"+(fileQueuePos+1)+" of "+filesList.length+", "+fileQueue+" remaining.");
	
	
	if (fileStyle==1) {
		
		//if (filesList[fileQueuePos].kind === 'file') {
			filename = filesList[fileQueuePos].name;
			processFile(filesList[fileQueuePos]);
		//}
		
	} 
	else if (fileStyle==2){
		// Use DataTransfer interface to access the file(s)
		
		filename = filesList[fileQueuePos].name;
		processFile(filesList[fileQueuePos]);
	}
	else{
		alert("unexpected fileSytle ="+fileStyle);
	}
	
}


//try and fail to sort file list by playID
/*function sortListByPlayID(a,b){
	var aID=getPlayIDOfFile(a);
	var bID=getPlayIDOfFile(b);
	return a-b;
}


var thisPlayID=-1;
function getPlayIDOfFile(replayFile){
	thisPlayID=-1;
	const reader = new FileReader();
	
	reader.onload = function(e) {
		ogFileBuffer=e.target.result;
		
		dataView2 = new DataView(ogFileBuffer);
		
		var tempVersion = dataView2.getUint32(4,true);//replay version number
		if (tempVersion==6){
			
			thisPlayID = dataView2.getUint16(44,true);//PlayID
			//alert("id in method = "+thisPlayID);
			return thisPlayID;
		}
		else{
			//alert("This replay version not supported yet: "+ReplayFileVersion+", "+ResultFlagsVersionFinal);//FIX THIS with new ResultFlagsVersion code if you edit this in
		}
	};
	reader.readAsArrayBuffer(replayFile);
	

	//alert("Play id of file being compared: "+thisPlayID);
	//return thisPlayID;
	
	
	
}*/

