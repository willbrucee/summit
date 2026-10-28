// History. US presidents and UK prime ministers come from Wikidata; these are extra names people use.

export const PRESIDENT_ALIASES = {
  'George Washington': ['Washington'],
  'John Adams': ['Adams'],
  'Thomas Jefferson': ['Jefferson'],
  'James Madison': ['Madison'],
  'James Monroe': ['Monroe'],
  'John Quincy Adams': ['Adams', 'JQA'],
  'Andrew Jackson': ['Jackson'],
  'Martin Van Buren': ['Van Buren'],
  'William Henry Harrison': ['Harrison'],
  'John Tyler': ['Tyler'],
  'James K. Polk': ['Polk', 'James Polk'],
  'Zachary Taylor': ['Taylor'],
  'Millard Fillmore': ['Fillmore'],
  'Franklin Pierce': ['Pierce'],
  'James Buchanan': ['Buchanan'],
  'Abraham Lincoln': ['Lincoln', 'Abe Lincoln'],
  'Andrew Johnson': ['Johnson'],
  'Ulysses S. Grant': ['Grant', 'Ulysses Grant'],
  'Rutherford B. Hayes': ['Hayes', 'Rutherford Hayes'],
  'James A. Garfield': ['Garfield', 'James Garfield'],
  'Chester A. Arthur': ['Arthur', 'Chester Arthur'],
  'Grover Cleveland': ['Cleveland'],
  'Benjamin Harrison': ['Harrison'],
  'William McKinley': ['McKinley'],
  'Theodore Roosevelt': ['Roosevelt', 'Teddy Roosevelt', 'TR'],
  'William Howard Taft': ['Taft'],
  'Woodrow Wilson': ['Wilson'],
  'Warren G. Harding': ['Harding', 'Warren Harding'],
  'Calvin Coolidge': ['Coolidge'],
  'Herbert Hoover': ['Hoover'],
  'Franklin D. Roosevelt': ['Roosevelt', 'FDR', 'Franklin Roosevelt', 'Franklin Delano Roosevelt'],
  'Harry S. Truman': ['Truman', 'Harry Truman'],
  'Dwight D. Eisenhower': ['Eisenhower', 'Ike', 'Dwight Eisenhower'],
  'John F. Kennedy': ['Kennedy', 'JFK', 'John Kennedy'],
  'Lyndon B. Johnson': ['Johnson', 'LBJ', 'Lyndon Johnson'],
  'Richard Nixon': ['Nixon'],
  'Gerald Ford': ['Ford'],
  'Jimmy Carter': ['Carter'],
  'Ronald Reagan': ['Reagan'],
  'George H. W. Bush': ['Bush', 'George Bush', 'Bush Senior', 'George HW Bush'],
  'Bill Clinton': ['Clinton'],
  'George W. Bush': ['Bush', 'George Bush', 'Bush Junior', 'Dubya', 'George W Bush'],
  'Barack Obama': ['Obama'],
  'Donald Trump': ['Trump'],
  'Joe Biden': ['Biden'],
};

export const PM_ALIASES = {
  'Robert Walpole': ['Walpole'],
  'Spencer Compton, 1st Earl of Wilmington': ['Wilmington', 'Lord Wilmington', 'Spencer Compton'],
  'Henry Pelham': ['Pelham'],
  'Thomas Pelham-Holles, 1st Duke of Newcastle': ['Duke of Newcastle', 'Newcastle', 'Pelham-Holles'],
  'William Cavendish, 4th Duke of Devonshire': ['Duke of Devonshire', 'Devonshire'],
  'John Stuart, 3rd Earl of Bute': ['Lord Bute', 'Bute', 'Earl of Bute'],
  'George Grenville': ['Grenville'],
  'Charles Watson-Wentworth, 2nd Marquess of Rockingham': ['Rockingham', 'Lord Rockingham'],
  'William Pitt the Elder, 1st Earl of Chatham': ['William Pitt', 'Pitt the Elder', 'Pitt', 'Chatham', 'Earl of Chatham'],
  'Augustus FitzRoy, 3rd Duke of Grafton': ['Grafton', 'Duke of Grafton'],
  'Frederick North, Lord North': ['Lord North', 'North'],
  'William Petty, 2nd Earl of Shelburne': ['Shelburne', 'Lord Shelburne'],
  'William Cavendish-Bentinck, 3rd Duke of Portland': ['Portland', 'Duke of Portland'],
  'William Pitt the Younger': ['William Pitt', 'Pitt', 'Pitt the Younger'],
  'Henry Addington': ['Addington', 'Lord Sidmouth'],
  'William Grenville, 1st Baron Grenville': ['Grenville', 'Lord Grenville', 'William Wyndham Grenville'],
  'Spencer Perceval': ['Perceval'],
  'Robert Jenkinson, 2nd Earl of Liverpool': ['Lord Liverpool', 'Liverpool'],
  'George Canning': ['Canning'],
  'F. J. Robinson, 1st Viscount Goderich': ['Goderich', 'Lord Goderich'],
  'Arthur Wellesley, 1st Duke of Wellington': ['Wellington', 'Duke of Wellington'],
  'Charles Grey, 2nd Earl Grey': ['Earl Grey', 'Lord Grey', 'Grey'],
  'William Lamb, 2nd Viscount Melbourne': ['Melbourne', 'Lord Melbourne'],
  'Robert Peel': ['Peel'],
  'John Russell, 1st Earl Russell': ['Lord John Russell', 'Russell', 'John Russell'],
  'Edward Smith-Stanley, 14th Earl of Derby': ['Derby', 'Lord Derby'],
  'George Hamilton-Gordon, 4th Earl of Aberdeen': ['Aberdeen', 'Lord Aberdeen'],
  'Henry John Temple, 3rd Viscount Palmerston': ['Palmerston', 'Lord Palmerston', 'Henry Temple'],
  'Benjamin Disraeli': ['Disraeli', 'Dizzy'],
  'William Ewart Gladstone': ['Gladstone', 'William Gladstone'],
  'Robert Gascoyne-Cecil, 3rd Marquess of Salisbury': ['Salisbury', 'Lord Salisbury'],
  'Archibald Primrose, 5th Earl of Rosebery': ['Rosebery', 'Lord Rosebery'],
  'Arthur Balfour': ['Balfour'],
  'Henry Campbell-Bannerman': ['Campbell-Bannerman'],
  'H. H. Asquith': ['Asquith', 'Herbert Asquith'],
  'David Lloyd George': ['Lloyd George'],
  'Bonar Law': ['Andrew Bonar Law', 'Law'],
  'Stanley Baldwin': ['Baldwin'],
  'Ramsay MacDonald': ['MacDonald'],
  'Neville Chamberlain': ['Chamberlain'],
  'Winston Churchill': ['Churchill'],
  'Clement Attlee': ['Attlee'],
  'Anthony Eden': ['Eden'],
  'Harold Macmillan': ['Macmillan'],
  'Alec Douglas-Home': ['Douglas-Home', 'Alec Douglas Home'],
  'Harold Wilson': ['Wilson'],
  'Edward Heath': ['Heath', 'Ted Heath'],
  'James Callaghan': ['Callaghan', 'Jim Callaghan'],
  'Margaret Thatcher': ['Thatcher'],
  'John Major': ['Major'],
  'Tony Blair': ['Blair'],
  'Gordon Brown': ['Brown'],
  'David Cameron': ['Cameron'],
  'Theresa May': ['May'],
  'Boris Johnson': ['Johnson'],
  'Liz Truss': ['Truss'],
  'Rishi Sunak': ['Sunak'],
  'Keir Starmer': ['Starmer'],
};

export const ROMAN_EMPERORS = `
Augustus | Octavian
Tiberius
Caligula | Gaius
Claudius
Nero
Galba
Otho
Vitellius
Vespasian
Titus
Domitian
Nerva
Trajan
Hadrian
Antoninus Pius
Marcus Aurelius
Lucius Verus
Commodus
Pertinax
Didius Julianus
Septimius Severus
Caracalla
Geta
Macrinus
Diadumenian
Elagabalus | Heliogabalus
Severus Alexander | Alexander Severus
Maximinus Thrax
Gordian I | Gordian
Gordian II | Gordian
Pupienus
Balbinus
Gordian III | Gordian
Philip the Arab | Philip
Decius | Trajan Decius
Herennius Etruscus
Trebonianus Gallus
Hostilian
Volusianus
Aemilianus | Aemilian
Valerian
Gallienus
Claudius Gothicus | Claudius II
Quintillus
Aurelian
Tacitus
Florianus | Florian
Probus
Carus
Carinus
Numerian
Diocletian
Maximian
Constantius I | Constantius Chlorus
Galerius
Severus II
Maxentius
Licinius
Maximinus Daza | Maximinus II
Constantine the Great | Constantine I | Constantine
Constantine II
Constans
Constantius II
Julian | Julian the Apostate
Jovian
Valentinian I | Valentinian
Valens
Gratian
Valentinian II | Valentinian
Theodosius I | Theodosius the Great | Theodosius
Arcadius
Honorius
Theodosius II | Theodosius
Constantius III
Valentinian III | Valentinian
Marcian
Petronius Maximus
Avitus
Majorian
Libius Severus
Anthemius
Olybrius
Glycerius
Leo I
Julius Nepos
Romulus Augustulus
Zeno
`;

export const PHARAOHS = `
Narmer | Menes
Hor-Aha | Aha
Djer
Den
Qa'a
Khasekhemwy
Djoser | Zoser
Sekhemkhet
Huni
Sneferu | Snefru
Khufu | Cheops
Djedefre
Khafre | Chephren
Menkaure | Mycerinus
Shepseskaf
Userkaf
Sahure
Neferirkare
Nyuserre
Djedkare Isesi | Isesi
Unas
Teti
Pepi I
Pepi II
Mentuhotep II
Amenemhat I
Senusret I | Sesostris I
Amenemhat II
Senusret II
Senusret III | Sesostris III
Amenemhat III
Sobekneferu
Ahmose I | Ahmose
Amenhotep I
Thutmose I | Tuthmosis I
Thutmose II
Hatshepsut
Thutmose III | Tuthmosis III
Amenhotep II
Thutmose IV
Amenhotep III
Akhenaten | Amenhotep IV | Akhenaton
Smenkhkare
Neferneferuaten | Nefertiti
Tutankhamun | Tutankhamen | King Tut | Tut
Ay
Horemheb
Ramesses I | Ramses I
Seti I
Ramesses II | Ramses II | Ramesses the Great | Ozymandias
Merneptah
Seti II
Siptah
Twosret | Tausret
Setnakhte
Ramesses III | Ramses III
Ramesses IV | Ramses IV
Ramesses VI | Ramses VI
Ramesses IX | Ramses IX
Ramesses XI | Ramses XI
Smendes
Psusennes I
Shoshenq I | Shishak
Osorkon II
Piye | Piankhi
Shabaka
Taharqa
Psamtik I | Psammetichus I
Necho II
Apries
Amasis II | Ahmose II
Nectanebo I
Nectanebo II
Ptolemy I Soter | Ptolemy I
Ptolemy II Philadelphus | Ptolemy II
Ptolemy III Euergetes | Ptolemy III
Ptolemy V | Ptolemy V Epiphanes
Ptolemy XII | Auletes
Cleopatra VII | Cleopatra
Ptolemy XIII
Caesarion | Ptolemy XV
Kamose
Seqenenre Tao
Sobekhotep
Neferhotep I
Khyan
Apepi | Apophis
`;

export const MONARCHS = `
Alfred the Great | Alfred
Edward the Elder
Athelstan | Æthelstan
Edmund I
Eadred
Eadwig | Edwy
Edgar the Peaceful | Edgar
Edward the Martyr
Ethelred the Unready | Æthelred the Unready | Ethelred
Sweyn Forkbeard | Sweyn
Edmund Ironside
Cnut | Canute | Cnut the Great
Harold Harefoot | Harold I
Harthacnut
Edward the Confessor
Harold Godwinson | Harold II
William I | William the Conqueror
William II | William Rufus
Henry I
Stephen | King Stephen
Empress Matilda | Matilda
Henry II
Richard I | Richard the Lionheart
John | King John
Henry III
Edward I | Longshanks
Edward II
Edward III
Richard II
Henry IV
Henry V
Henry VI
Edward IV
Edward V
Richard III
Henry VII
Henry VIII
Edward VI
Lady Jane Grey | Jane Grey
Mary I | Bloody Mary | Mary Tudor
Elizabeth I | Elizabeth the First
James I | James VI
Charles I
Charles II
James II
William III | William of Orange
Mary II
Anne | Queen Anne
George I
George II
George III
George IV
William IV
Victoria | Queen Victoria
Edward VII
George V
Edward VIII
George VI
Elizabeth II | Queen Elizabeth II
Charles III | King Charles III
`;

export const WARS = `
World War I | First World War | WW1 | WWI | Great War
World War II | Second World War | WW2 | WWII
Hundred Years' War | Hundred Years War
Thirty Years' War | Thirty Years War
Seven Years' War | Seven Years War
Eighty Years' War
Napoleonic Wars
French Revolutionary Wars
War of the Roses | Wars of the Roses
English Civil War
American Civil War
American Revolutionary War | American War of Independence | Revolutionary War
War of 1812
Mexican-American War
Spanish-American War
Crimean War
Franco-Prussian War
Austro-Prussian War
Boer War | Second Boer War
First Boer War
Zulu War | Anglo-Zulu War
Opium Wars | Opium War
Boxer Rebellion
Russo-Japanese War
Sino-Japanese War
Korean War
Vietnam War
Cold War
Gulf War
Iraq War
War in Afghanistan | Afghanistan War
Soviet-Afghan War
Falklands War
Iran-Iraq War
Six-Day War
Yom Kippur War
Suez Crisis
Bosnian War
Kosovo War
Croatian War of Independence
Russo-Ukrainian War | War in Ukraine
Syrian Civil War
Spanish Civil War
Russian Civil War
Chinese Civil War
Irish War of Independence
Irish Civil War
Greek War of Independence
Mexican War of Independence
Mexican Revolution
Peloponnesian War
Persian Wars | Greco-Persian Wars
Trojan War
Punic Wars
First Punic War
Second Punic War
Third Punic War
Gallic Wars
Crusades
First Crusade
Third Crusade
Reconquista
Mongol invasions
Anglo-Dutch Wars
War of the Spanish Succession
War of the Austrian Succession
Jacobite Rising | Jacobite rebellion
Great Northern War
Nine Years' War
Wars of the Three Kingdoms
War of Jenkins' Ear
French and Indian War
Anglo-Afghan War
Anglo-Sikh War
Indian Rebellion of 1857 | Indian Mutiny
Taiping Rebellion
Paraguayan War | War of the Triple Alliance
War of the Pacific
Chaco War
Winter War
Continuation War
Greco-Turkish War
Balkan Wars
Turkish War of Independence
Polish-Soviet War
Algerian War
Indochina War | First Indochina War
Malayan Emergency
Mau Mau Uprising | Mau Mau rebellion
Biafran War | Nigerian Civil War
Bangladesh Liberation War
Indo-Pakistani War
Football War
The Troubles | Troubles
Lebanese Civil War
Rwandan Civil War
First Congo War
Second Congo War
Sri Lankan Civil War
Angolan Civil War
Mozambican Civil War
Eritrean War of Independence
Ethiopian Civil War
Somali Civil War
Chechen War | First Chechen War
Second Chechen War
Russo-Georgian War
Libyan Civil War
Yemeni Civil War
Tigray War
Nagorno-Karabakh War
Israel-Hamas war | Gaza war
Pig War
War of the Bucket
Emu War
Anglo-Zanzibar War
Cod Wars
Toledo War
Aroostook War
Bleeding Kansas
Texas Revolution
Haitian Revolution
Glorious Revolution
French Revolution
Russian Revolution
Hussite Wars
Italian Wars
Wars of Religion | French Wars of Religion
Schmalkaldic War
Kalmar War
Scanian War
Livonian War
Russo-Turkish War
Anglo-Spanish War
Second Sino-Japanese War
Pacific War
Philippine-American War
Banana Wars
Contra War
Salvadoran Civil War
Guatemalan Civil War
Colombian conflict
Cuban Revolution
Bay of Pigs | Bay of Pigs Invasion
Invasion of Grenada
Invasion of Panama
`;

export const EXPLORERS = `
Christopher Columbus | Columbus
Ferdinand Magellan | Magellan
Vasco da Gama | Da Gama
Marco Polo
James Cook | Captain Cook
Amerigo Vespucci | Vespucci
John Cabot | Cabot
Sebastian Cabot
Bartolomeu Dias | Bartholomew Dias
Hernan Cortes | Hernán Cortés | Cortes
Francisco Pizarro | Pizarro
Juan Ponce de Leon | Ponce de León
Hernando de Soto | De Soto
Francisco Vasquez de Coronado | Coronado
Jacques Cartier | Cartier
Samuel de Champlain | Champlain
Henry Hudson | Hudson
Walter Raleigh | Sir Walter Raleigh | Raleigh
Francis Drake | Sir Francis Drake | Drake
Martin Frobisher | Frobisher
Abel Tasman | Tasman
Willem Janszoon
Dirk Hartog
William Dampier | Dampier
Matthew Flinders | Flinders
George Bass
Burke and Wills | Robert O'Hara Burke | William John Wills
John McDouall Stuart
Charles Sturt | Sturt
Ludwig Leichhardt | Leichhardt
Edward John Eyre | Eyre
Lewis and Clark | Meriwether Lewis | William Clark
Sacagawea
Zebulon Pike
Daniel Boone
Leif Erikson | Leif Ericson | Leif Eriksson
Erik the Red
Ibn Battuta
Zheng He
Xuanzang
Ahmad ibn Fadlan | Ibn Fadlan
Hanno the Navigator | Hanno
Pytheas
Roald Amundsen | Amundsen
Robert Falcon Scott | Captain Scott | Scott
Ernest Shackleton | Shackleton
Douglas Mawson | Mawson
Fridtjof Nansen | Nansen
Robert Peary | Peary
Matthew Henson
Frederick Cook
John Franklin | Sir John Franklin
James Clark Ross
Edmund Hillary | Sir Edmund Hillary | Hillary
Tenzing Norgay | Tenzing
David Livingstone | Livingstone
Henry Morton Stanley | Stanley
Richard Francis Burton | Richard Burton
John Hanning Speke | Speke
Mungo Park
Mary Kingsley
Gertrude Bell
Isabella Bird
Freya Stark
Alexander von Humboldt | Humboldt
Charles Darwin
Joseph Banks
Vitus Bering | Bering
Jean-Francois de La Perouse | La Pérouse
Louis Antoine de Bougainville | Bougainville
Jacques Cousteau | Cousteau
Thor Heyerdahl | Heyerdahl
Yuri Gagarin
Neil Armstrong
Amelia Earhart | Earhart
Charles Lindbergh | Lindbergh
Ranulph Fiennes | Sir Ranulph Fiennes
Reinhold Messner | Messner
George Mallory | Mallory
Robert Ballard
Jacques Piccard
Don Walsh
James Cameron
Pedro Alvares Cabral | Pedro Álvares Cabral | Cabral
Diego Cao | Diogo Cão
Henry the Navigator | Prince Henry the Navigator
Juan Sebastian Elcano | Elcano
Francisco de Orellana | Orellana
Vasco Nunez de Balboa | Balboa
Alvar Nunez Cabeza de Vaca | Cabeza de Vaca
Juan Rodriguez Cabrillo | Cabrillo
Rene-Robert Cavelier de La Salle | La Salle
Jacques Marquette | Marquette
Louis Jolliet
Simon Fraser
Alexander Mackenzie
David Thompson
Samuel Hearne
George Vancouver | Vancouver
John Rae
William Baffin | Baffin
John Davis
Willem Barentsz | Barentsz | Barents
Semyon Dezhnev
Nikolai Przhevalsky | Przhevalsky
Sven Hedin
Ella Maillart
Annie Londonderry
Nellie Bly
Jeanne Bare | Jeanne Baret
Eric Shipton
Bill Tilman
Apsley Cherry-Garrard
Tom Crean
Lawrence Oates | Captain Oates
Edward Wilson
Frank Wild
Ann Bancroft
Liv Arnesen
Felicity Aston
Robin Knox-Johnston
Ellen MacArthur
`;

export const DYNASTIES = `
Xia | Xia dynasty
Shang | Shang dynasty | Yin
Zhou | Zhou dynasty
Western Zhou
Eastern Zhou
Qin | Qin dynasty | Ch'in
Han | Han dynasty
Western Han
Eastern Han
Xin | Xin dynasty
Cao Wei | Wei
Shu Han | Shu
Eastern Wu | Wu
Jin | Jin dynasty | Western Jin
Eastern Jin
Northern Wei
Liu Song
Southern Qi
Liang | Liang dynasty
Chen | Chen dynasty
Sui | Sui dynasty
Tang | Tang dynasty
Wu Zhou
Later Liang
Later Tang
Later Jin
Later Han
Later Zhou
Liao | Liao dynasty
Song | Song dynasty
Northern Song
Southern Song
Western Xia
Jurchen Jin | Jin
Yuan | Yuan dynasty
Ming | Ming dynasty
Qing | Qing dynasty | Manchu
Northern Qi
Northern Zhou
`;

export const CIVILISATIONS = `
Ancient Egypt | Egyptians | Egyptian
Ancient Greece | Greeks | Greek
Ancient Rome | Romans | Roman
Mesopotamia
Sumer | Sumerians | Sumerian
Akkad | Akkadians | Akkadian Empire
Babylon | Babylonians | Babylonian
Assyria | Assyrians | Assyrian
Hittites | Hittite
Phoenicia | Phoenicians | Phoenician
Carthage | Carthaginians
Persia | Persians | Persian Empire | Achaemenid
Minoans | Minoan
Mycenaeans | Mycenaean
Etruscans | Etruscan
Celts | Celtic
Indus Valley | Harappan | Indus Valley Civilisation
Maurya | Mauryan
Gupta
Ancient China | Chinese
Shang
Zhou
Olmec | Olmecs
Maya | Mayans | Mayan
Aztec | Aztecs | Mexica
Inca | Incas | Incan
Zapotec
Mixtec
Toltec
Teotihuacan
Moche
Nazca | Nazca culture
Chavin | Chavín
Tiwanaku
Wari
Chimu | Chimú
Norte Chico | Caral
Ancestral Puebloans | Anasazi
Mississippian | Cahokia
Hopewell
Kush | Kushites | Nubia | Nubians
Aksum | Axum | Aksumite
Great Zimbabwe
Mali Empire
Songhai | Songhai Empire
Ghana Empire
Benin Kingdom | Kingdom of Benin
Nok
Lydia | Lydians
Urartu
Elam | Elamites
Hebrews | Israelites
Philistines
Scythians
Parthians | Parthia
Sassanids | Sasanian
Khmer | Khmer Empire | Angkor
Champa
Srivijaya
Majapahit
Funan
Jomon | Jōmon
Yayoi
Goguryeo
Silla
Baekje
Vikings | Norse
Anglo-Saxons
Byzantines | Byzantine Empire
Ottomans
Mongols
Huns
Goths
Vandals
Franks
Picts
Polynesians
Aboriginal Australians
Rapa Nui
Hohokam
Thracians
Dacians
Illyrians
Nabataeans | Petra
Sabaeans | Saba | Sheba
Amorites
Hurrians
Mitanni
Kassites
Canaanites
Cycladic
Vinca | Vinča
Cucuteni-Trypillia
Jiahu
Liangzhu
Sanxingdui
Bactria | Bactrian
Sogdians
Xiongnu
Tartessos
Iberians
`;

export const EMPIRES = `
Roman Empire
Holy Roman Empire
Byzantine Empire | Eastern Roman Empire
British Empire
Spanish Empire
Portuguese Empire
French Empire | French colonial empire
Napoleonic Empire | First French Empire
Second French Empire
German Empire | Second Reich
Austrian Empire
Austro-Hungarian Empire | Austria-Hungary
Russian Empire
Ottoman Empire
Mongol Empire
Golden Horde
Timurid Empire
Mughal Empire
Maratha Empire
Maurya Empire | Mauryan Empire
Gupta Empire
Chola Empire | Chola dynasty
Vijayanagara Empire
Sikh Empire
Persian Empire
Achaemenid Empire
Parthian Empire
Sasanian Empire | Sassanid Empire
Safavid Empire
Seleucid Empire
Ptolemaic Kingdom
Macedonian Empire | Alexander's empire
Athenian Empire | Delian League
Carthaginian Empire
Assyrian Empire | Neo-Assyrian Empire
Babylonian Empire | Neo-Babylonian Empire
Akkadian Empire
Hittite Empire
Egyptian Empire | New Kingdom
Kushite Empire | Kingdom of Kush
Aksumite Empire | Kingdom of Aksum
Mali Empire
Songhai Empire
Ghana Empire
Kanem-Bornu Empire
Ethiopian Empire
Zulu Kingdom | Zulu Empire
Ashanti Empire
Oyo Empire
Benin Empire
Aztec Empire
Inca Empire
Maya Empire
Empire of Japan | Japanese Empire
Qing Empire
Ming Empire
Han Empire
Tang Empire
Yuan Empire
Khmer Empire
Majapahit Empire
Srivijaya Empire
Abbasid Caliphate
Umayyad Caliphate
Rashidun Caliphate
Fatimid Caliphate
Ayyubid Empire
Mamluk Sultanate
Seljuk Empire
Ghaznavid Empire
Delhi Sultanate
Carolingian Empire
Frankish Empire
Angevin Empire
North Sea Empire
Polish-Lithuanian Commonwealth
Swedish Empire
Dutch Empire
Danish Empire
Belgian Empire | Belgian colonial empire
Italian Empire
Brazilian Empire | Empire of Brazil
Mexican Empire
Korean Empire
Tibetan Empire
Hunnic Empire
Gokturk Khaganate | Turkic Khaganate
Khazar Khaganate
Bulgarian Empire
Serbian Empire
Latin Empire
Trebizond Empire
Nicaean Empire
Palmyrene Empire
Gallic Empire
Soviet Union | USSR
Third Reich | Nazi Germany
American Empire
Durrani Empire
Ilkhanate
Chagatai Khanate
Kievan Rus
`;

export const SHIPS = `
Titanic | RMS Titanic
Lusitania | RMS Lusitania
Mary Rose
Victory | HMS Victory
Cutty Sark
Mayflower
Santa Maria | Santa María
Nina | Niña
Pinta
Golden Hind
Endeavour | HMS Endeavour
Beagle | HMS Beagle
Bounty | HMS Bounty
Endurance
Terra Nova
Discovery | RRS Discovery
Fram
Erebus | HMS Erebus
Terror | HMS Terror
Bismarck
Tirpitz
Yamato
Arizona | USS Arizona
Missouri | USS Missouri
Enterprise | USS Enterprise
Constitution | USS Constitution | Old Ironsides
Monitor | USS Monitor
Merrimack | CSS Virginia
Hood | HMS Hood
Belfast | HMS Belfast
Dreadnought | HMS Dreadnought
Warrior | HMS Warrior
Ark Royal | HMS Ark Royal
Queen Elizabeth | HMS Queen Elizabeth
Prince of Wales | HMS Prince of Wales
Vasa
Great Britain | SS Great Britain
Great Eastern | SS Great Eastern
Great Western | SS Great Western
Britannic | HMHS Britannic
Olympic | RMS Olympic
Carpathia | RMS Carpathia
Californian | SS Californian
Queen Mary | RMS Queen Mary
Queen Mary 2
Queen Elizabeth 2 | QE2
Normandie
Andrea Doria
Edmund Fitzgerald | SS Edmund Fitzgerald
Mary Celeste
Flying Cloud
Thermopylae
Kon-Tiki
Rainbow Warrior
Calypso
Exxon Valdez
Costa Concordia
Wilhelm Gustloff
Belgrano | General Belgrano
Sheffield | HMS Sheffield
Ever Given
Batavia
Amistad
Bluenose
Potemkin | Battleship Potemkin
Aurora
Mikasa
Graf Spee | Admiral Graf Spee
Scharnhorst
Indianapolis | USS Indianapolis
Maine | USS Maine
Nautilus | USS Nautilus
Kursk
Thresher | USS Thresher
Resolute | HMS Resolute
Revenge | Queen Anne's Revenge
Black Pearl
Flying Dutchman
Pequod
Hispaniola
Argo
Ark | Noah's Ark
Royal Yacht Britannia | Britannia
Sir David Attenborough | RRS Sir David Attenborough | Boaty McBoatface
Empress of Ireland
Lancastria
Waratah
Zong
Hesperus
Henri Grace a Dieu | Henry Grace a Dieu
Sovereign of the Seas
Royal Charles
Temeraire | HMS Temeraire
Bellerophon | HMS Bellerophon
`;
