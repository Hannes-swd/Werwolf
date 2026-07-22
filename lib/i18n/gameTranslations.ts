export const GAME_TRANSLATIONS = {
  en: {
    roles: {
      villager: 'Villager',
      werewolf: 'Werewolf',
      witch: 'Witch',
      seer: 'Seer',
      hunter: 'Hunter',
      amor: 'Cupid',
      fool: 'Village Fool',
      girl: 'Little Girl',
      priest: 'Priest',
      unknown: 'Unknown role',
      hidden: 'Role hidden',
    },
    game: {
      loading: 'Loading game',
      playerMissing: 'Player not found',
      home: 'Main menu',
      unknownPlayer: 'Unknown',
      mayor: 'Mayor',
      round: 'Round {{round}}',
      aliveCount: '{{alive}} of {{total}} alive',
      village: 'Village',
      activeCount: '{{count}} active',
      roleConfirm: 'I understand my role',
      roleSecret: 'Keep this card to yourself.',
      lover: { label: 'Your secret bond', description: 'You are linked with {{name}}. If one of you falls, the other follows.' },
      notices: {
        wolfObserved: 'Someone watched the pack tonight.',
        invalidAction: 'That action is no longer valid. The game was not changed.',
        nightDeaths: '{{names}} died overnight.',
        invalidVote: 'That vote could not be accepted.',
        actionSendFailed: 'Could not send the action. Please try again.',
        peekSendFailed: 'Could not send the peek. Please try again.',
        voteSendFailed: 'Could not send the vote. Please try again.',
      },
      events: {
        mayorElected: '{{name}} was elected mayor',
        diedAtNight: '{{name}} died during the night',
        healed: '{{name}} was healed',
        poisoned: '{{name}} was poisoned',
        foolRevealed: '{{name}} is the Village Fool and loses their vote',
        eliminated: '{{name}} was eliminated by the village',
        decided: 'The game has been decided',
      },
      hunter: {
        eyebrow: 'Final shot',
        title: 'Take someone with you',
        description: 'Choose one living player. This decision is final.',
      },
      mayorPass: {
        eyebrow: 'Final duty',
        title: 'Pass on the title',
        description: 'Choose who will lead the village through future ties.',
      },
      discussion: {
        eyebrow: 'The village wakes',
        title: 'Time for suspicion',
        description: 'Compare your stories and decide who you can still trust.',
        deaths: 'Lost overnight: {{names}}',
        survived: 'Everyone survived the night.',
        startVote: 'Start vote',
        waiting: 'The host will start the vote shortly.',
      },
      tie: {
        eyebrow: 'Tie',
        hostDecides: 'The host decides',
        mayorDecides: 'The mayor decides',
        choose: 'Choose only from the tied players.',
        waitingHost: 'The host is making the final decision.',
        waitingMayor: '{{name}} is making the final decision.',
        defaultMayor: 'The mayor',
        resolving: 'Decision in progress',
      },
      pending: {
        title: 'One final decision remains',
        description: 'The round will continue automatically afterwards.',
      },
      status: {
        night: 'Night · {{phase}}',
        waiting: 'Waiting',
        amor: 'Cupid',
        priest: 'Priest',
        wolf: 'The pack',
        witch: 'The witch',
        seer: 'The seer',
        discussion: 'Day · Discussion',
        vote: 'Day · Vote',
        election: 'Mayor election',
        tie: 'Tie',
        hunter: 'Final shot',
        mayorPass: 'Title handover',
        active: 'Game in progress',
      },
      winner: {
        village: 'The village wins',
        wolves: 'The pack wins',
        lovers: 'The lovers win',
        ended: 'Game over',
        eyebrow: 'Every role is revealed',
        rounds: 'Rounds played: {{rounds}}',
        results: 'Roles and scores',
        playerCount: 'Players: {{count}}',
        you: 'You',
        place: 'Place {{place}}',
        points: '{{score}} points',
        rematch: 'Play again',
        join: 'Join rematch',
        waiting: 'Waiting for rematch',
      },
    },
  },
  de: {
    roles: {
      villager: 'Dorfbewohner', werewolf: 'Werwolf', witch: 'Hexe', seer: 'Seher', hunter: 'Jäger',
      amor: 'Amor', fool: 'Dorfdepp', girl: 'Mädchen', priest: 'Priester', unknown: 'Unbekannte Rolle', hidden: 'Rolle verborgen',
    },
    game: {
      loading: 'Spielstand wird geladen', playerMissing: 'Spieler nicht gefunden', home: 'Hauptmenü', unknownPlayer: 'Unbekannt', mayor: 'Bürgermeister',
      round: 'Runde {{round}}', aliveCount: '{{alive}} von {{total}} am Leben', village: 'Dorf', activeCount: '{{count}} aktiv',
      roleConfirm: 'Rolle verstanden', roleSecret: 'Zeige diese Karte niemandem.',
      lover: { label: 'Eure geheime Verbindung', description: 'Du bist mit {{name}} verbunden. Fällt einer von euch, folgt der andere.' },
      notices: {
        wolfObserved: 'Jemand hat das Rudel in dieser Nacht beobachtet.', invalidAction: 'Diese Aktion ist nicht mehr gültig. Der Spielstand wurde nicht verändert.',
        nightDeaths: '{{names}} starb in dieser Nacht.', invalidVote: 'Diese Stimme konnte nicht angenommen werden.',
        actionSendFailed: 'Die Aktion konnte nicht gesendet werden. Bitte erneut versuchen.', peekSendFailed: 'Der Blick konnte nicht übermittelt werden. Bitte erneut versuchen.',
        voteSendFailed: 'Die Stimme konnte nicht gesendet werden. Bitte erneut versuchen.',
      },
      events: {
        mayorElected: '{{name}} wurde zum Bürgermeister gewählt', diedAtNight: '{{name}} ist in der Nacht gestorben', healed: '{{name}} wurde geheilt',
        poisoned: '{{name}} wurde vergiftet', foolRevealed: '{{name}} ist der Dorfdepp und verliert das Stimmrecht',
        eliminated: '{{name}} wurde vom Dorf eliminiert', decided: 'Das Spiel ist entschieden',
      },
      hunter: { eyebrow: 'Letzter Schuss', title: 'Du nimmst jemanden mit', description: 'Wähle einen lebenden Spieler. Diese Entscheidung ist endgültig.' },
      mayorPass: { eyebrow: 'Letzte Amtshandlung', title: 'Gib den Titel weiter', description: 'Bestimme, wer das Dorf künftig durch Gleichstände führt.' },
      discussion: {
        eyebrow: 'Das Dorf erwacht', title: 'Zeit für Verdacht', description: 'Vergleicht eure Geschichten und entscheidet, wem ihr noch vertraut.',
        deaths: 'In der Nacht gestorben: {{names}}', survived: 'Alle haben die Nacht überlebt.', startVote: 'Abstimmung beginnen', waiting: 'Die Spielleitung startet gleich die Abstimmung.',
      },
      tie: {
        eyebrow: 'Gleichstand', hostDecides: 'Die Spielleitung entscheidet', mayorDecides: 'Der Bürgermeister entscheidet',
        choose: 'Wähle nur zwischen den Personen mit Höchststand.', waitingHost: 'Die Spielleitung trifft die letzte Entscheidung.',
        waitingMayor: '{{name}} trifft die letzte Entscheidung.', defaultMayor: 'Der Bürgermeister', resolving: 'Entscheidung läuft',
      },
      pending: { title: 'Eine letzte Entscheidung steht aus', description: 'Die Runde geht danach automatisch weiter.' },
      status: {
        night: 'Nacht · {{phase}}', waiting: 'Warten', amor: 'Amor', priest: 'Priester', wolf: 'Das Rudel', witch: 'Die Hexe', seer: 'Der Seher',
        discussion: 'Tag · Diskussion', vote: 'Tag · Abstimmung', election: 'Bürgermeisterwahl', tie: 'Gleichstand', hunter: 'Letzter Schuss',
        mayorPass: 'Amtsübergabe', active: 'Spiel läuft',
      },
      winner: {
        village: 'Das Dorf gewinnt', wolves: 'Das Rudel gewinnt', lovers: 'Das Liebespaar gewinnt', ended: 'Das Spiel ist beendet',
        eyebrow: 'Alle Rollen werden aufgedeckt', rounds: 'Gespielte Runden: {{rounds}}', results: 'Rollen und Punkte', playerCount: 'Spieler: {{count}}',
        you: 'Du', place: 'Platz {{place}}', points: '{{score}} Punkte', rematch: 'Neue Runde', join: 'Neuer Runde beitreten', waiting: 'Warte auf neue Runde',
      },
    },
  },
  es: {
    roles: {
      villager: 'Aldeano', werewolf: 'Hombre lobo', witch: 'Bruja', seer: 'Vidente', hunter: 'Cazador', amor: 'Cupido',
      fool: 'Tonto del pueblo', girl: 'Niña', priest: 'Sacerdote', unknown: 'Rol desconocido', hidden: 'Rol oculto',
    },
    game: {
      loading: 'Cargando partida', playerMissing: 'Jugador no encontrado', home: 'Menú principal', unknownPlayer: 'Desconocido', mayor: 'Alcalde',
      round: 'Ronda {{round}}', aliveCount: '{{alive}} de {{total}} con vida', village: 'Pueblo', activeCount: '{{count}} activos',
      roleConfirm: 'Entiendo mi rol', roleSecret: 'No enseñes esta carta a nadie.',
      lover: { label: 'Vuestro vínculo secreto', description: 'Estás unido a {{name}}. Si uno cae, el otro le sigue.' },
      notices: {
        wolfObserved: 'Alguien observó a la manada esta noche.', invalidAction: 'Esa acción ya no es válida. La partida no cambió.',
        nightDeaths: '{{names}} murió durante la noche.', invalidVote: 'No se pudo aceptar ese voto.',
        actionSendFailed: 'No se pudo enviar la acción. Inténtalo otra vez.', peekSendFailed: 'No se pudo enviar la mirada. Inténtalo otra vez.',
        voteSendFailed: 'No se pudo enviar el voto. Inténtalo otra vez.',
      },
      events: {
        mayorElected: '{{name}} fue elegido alcalde', diedAtNight: '{{name}} murió durante la noche', healed: '{{name}} fue curado', poisoned: '{{name}} fue envenenado',
        foolRevealed: '{{name}} es el tonto del pueblo y pierde su voto', eliminated: '{{name}} fue eliminado por el pueblo', decided: 'La partida está decidida',
      },
      hunter: { eyebrow: 'Último disparo', title: 'Llévate a alguien contigo', description: 'Elige a un jugador vivo. La decisión es definitiva.' },
      mayorPass: { eyebrow: 'Último deber', title: 'Entrega el cargo', description: 'Elige quién resolverá los próximos empates.' },
      discussion: {
        eyebrow: 'El pueblo despierta', title: 'Hora de sospechar', description: 'Comparad vuestras historias y decidid en quién confiar.',
        deaths: 'Bajas de la noche: {{names}}', survived: 'Todos sobrevivieron a la noche.', startVote: 'Empezar votación', waiting: 'El anfitrión iniciará la votación pronto.',
      },
      tie: {
        eyebrow: 'Empate', hostDecides: 'Decide el anfitrión', mayorDecides: 'Decide el alcalde', choose: 'Elige solo entre los jugadores empatados.',
        waitingHost: 'El anfitrión toma la decisión final.', waitingMayor: '{{name}} toma la decisión final.', defaultMayor: 'El alcalde', resolving: 'Decisión en curso',
      },
      pending: { title: 'Queda una última decisión', description: 'La ronda continuará automáticamente después.' },
      status: {
        night: 'Noche · {{phase}}', waiting: 'Esperando', amor: 'Cupido', priest: 'Sacerdote', wolf: 'La manada', witch: 'La bruja', seer: 'El vidente',
        discussion: 'Día · Debate', vote: 'Día · Votación', election: 'Elección de alcalde', tie: 'Empate', hunter: 'Último disparo', mayorPass: 'Traspaso del cargo', active: 'Partida en curso',
      },
      winner: {
        village: 'Gana el pueblo', wolves: 'Gana la manada', lovers: 'Ganan los enamorados', ended: 'Fin de la partida', eyebrow: 'Se revelan todos los roles',
        rounds: 'Rondas jugadas: {{rounds}}', results: 'Roles y puntos', playerCount: 'Jugadores: {{count}}', you: 'Tú', place: 'Puesto {{place}}', points: '{{score}} puntos',
        rematch: 'Jugar otra vez', join: 'Unirse a la revancha', waiting: 'Esperando la revancha',
      },
    },
  },
  fr: {
    roles: {
      villager: 'Villageois', werewolf: 'Loup-garou', witch: 'Sorcière', seer: 'Voyante', hunter: 'Chasseur', amor: 'Cupidon',
      fool: 'Idiot du village', girl: 'Petite fille', priest: 'Prêtre', unknown: 'Rôle inconnu', hidden: 'Rôle masqué',
    },
    game: {
      loading: 'Chargement de la partie', playerMissing: 'Joueur introuvable', home: 'Menu principal', unknownPlayer: 'Inconnu', mayor: 'Maire',
      round: 'Manche {{round}}', aliveCount: '{{alive}} sur {{total}} en vie', village: 'Village', activeCount: '{{count}} actifs',
      roleConfirm: "J'ai compris mon rôle", roleSecret: 'Ne montrez cette carte à personne.',
      lover: { label: 'Votre lien secret', description: 'Vous êtes lié à {{name}}. Si l’un tombe, l’autre le suit.' },
      notices: {
        wolfObserved: "Quelqu'un a observé la meute cette nuit.", invalidAction: "Cette action n'est plus valide. La partie n'a pas changé.",
        nightDeaths: '{{names}} est mort cette nuit.', invalidVote: "Ce vote n'a pas pu être accepté.",
        actionSendFailed: "Impossible d'envoyer l'action. Réessayez.", peekSendFailed: "Impossible d'envoyer le regard. Réessayez.",
        voteSendFailed: "Impossible d'envoyer le vote. Réessayez.",
      },
      events: {
        mayorElected: '{{name}} a été élu maire', diedAtNight: '{{name}} est mort pendant la nuit', healed: '{{name}} a été soigné', poisoned: '{{name}} a été empoisonné',
        foolRevealed: '{{name}} est idiot du village et perd son vote', eliminated: '{{name}} a été éliminé par le village', decided: 'La partie est terminée',
      },
      hunter: { eyebrow: 'Dernier tir', title: 'Emportez quelqu’un avec vous', description: 'Choisissez un joueur vivant. Cette décision est définitive.' },
      mayorPass: { eyebrow: 'Dernier devoir', title: 'Transmettez le titre', description: 'Choisissez qui départagera les prochains votes.' },
      discussion: {
        eyebrow: "Le village s'éveille", title: 'Le temps des soupçons', description: 'Comparez vos histoires et décidez à qui faire confiance.',
        deaths: 'Morts cette nuit : {{names}}', survived: 'Tout le monde a survécu à la nuit.', startVote: 'Lancer le vote', waiting: "L'hôte lancera bientôt le vote.",
      },
      tie: {
        eyebrow: 'Égalité', hostDecides: "L'hôte décide", mayorDecides: 'Le maire décide', choose: 'Choisissez uniquement parmi les joueurs à égalité.',
        waitingHost: "L'hôte prend la décision finale.", waitingMayor: '{{name}} prend la décision finale.', defaultMayor: 'Le maire', resolving: 'Décision en cours',
      },
      pending: { title: 'Une dernière décision reste', description: 'La manche continuera ensuite automatiquement.' },
      status: {
        night: 'Nuit · {{phase}}', waiting: 'En attente', amor: 'Cupidon', priest: 'Prêtre', wolf: 'La meute', witch: 'La sorcière', seer: 'La voyante',
        discussion: 'Jour · Discussion', vote: 'Jour · Vote', election: 'Élection du maire', tie: 'Égalité', hunter: 'Dernier tir', mayorPass: 'Passation du titre', active: 'Partie en cours',
      },
      winner: {
        village: 'Le village gagne', wolves: 'La meute gagne', lovers: 'Les amoureux gagnent', ended: 'Partie terminée', eyebrow: 'Tous les rôles sont révélés',
        rounds: 'Manches jouées : {{rounds}}', results: 'Rôles et scores', playerCount: 'Joueurs : {{count}}', you: 'Vous', place: 'Place {{place}}', points: '{{score}} points',
        rematch: 'Rejouer', join: 'Rejoindre la revanche', waiting: 'En attente de la revanche',
      },
    },
  },
  it: {
    roles: {
      villager: 'Abitante', werewolf: 'Lupo mannaro', witch: 'Strega', seer: 'Veggente', hunter: 'Cacciatore', amor: 'Cupido',
      fool: 'Matto del villaggio', girl: 'Bambina', priest: 'Sacerdote', unknown: 'Ruolo sconosciuto', hidden: 'Ruolo nascosto',
    },
    game: {
      loading: 'Carico la partita', playerMissing: 'Giocatore non trovato', home: 'Menu principale', unknownPlayer: 'Sconosciuto', mayor: 'Sindaco',
      round: 'Turno {{round}}', aliveCount: '{{alive}} su {{total}} vivi', village: 'Villaggio', activeCount: '{{count}} attivi',
      roleConfirm: 'Ho capito il mio ruolo', roleSecret: 'Non mostrare questa carta a nessuno.',
      lover: { label: 'Il vostro legame segreto', description: 'Sei legato a {{name}}. Se uno cade, l’altro lo segue.' },
      notices: {
        wolfObserved: 'Qualcuno ha osservato il branco stanotte.', invalidAction: 'Questa azione non è più valida. La partita non è cambiata.',
        nightDeaths: '{{names}} è morto durante la notte.', invalidVote: 'Non posso accettare questo voto.',
        actionSendFailed: "Non posso inviare l'azione. Riprova.", peekSendFailed: 'Non posso inviare lo sguardo. Riprova.',
        voteSendFailed: 'Non posso inviare il voto. Riprova.',
      },
      events: {
        mayorElected: '{{name}} è stato eletto sindaco', diedAtNight: '{{name}} è morto durante la notte', healed: '{{name}} è stato curato', poisoned: '{{name}} è stato avvelenato',
        foolRevealed: '{{name}} è il matto del villaggio e perde il voto', eliminated: '{{name}} è stato eliminato dal villaggio', decided: 'La partita è decisa',
      },
      hunter: { eyebrow: 'Ultimo colpo', title: 'Porta qualcuno con te', description: 'Scegli un giocatore vivo. La decisione è definitiva.' },
      mayorPass: { eyebrow: 'Ultimo incarico', title: 'Passa il titolo', description: 'Scegli chi risolverà i prossimi pareggi.' },
      discussion: {
        eyebrow: 'Il villaggio si sveglia', title: 'È tempo di sospetti', description: 'Confrontate le storie e decidete di chi fidarvi.',
        deaths: 'Morti nella notte: {{names}}', survived: 'Tutti hanno superato la notte.', startVote: 'Inizia voto', waiting: "L'host inizierà presto il voto.",
      },
      tie: {
        eyebrow: 'Pareggio', hostDecides: "Decide l'host", mayorDecides: 'Decide il sindaco', choose: 'Scegli solo tra i giocatori in pareggio.',
        waitingHost: "L'host prende la decisione finale.", waitingMayor: '{{name}} prende la decisione finale.', defaultMayor: 'Il sindaco', resolving: 'Decisione in corso',
      },
      pending: { title: "Manca un'ultima decisione", description: 'Il turno continuerà subito dopo.' },
      status: {
        night: 'Notte · {{phase}}', waiting: 'Attesa', amor: 'Cupido', priest: 'Sacerdote', wolf: 'Il branco', witch: 'La strega', seer: 'Il veggente',
        discussion: 'Giorno · Discussione', vote: 'Giorno · Voto', election: 'Elezione del sindaco', tie: 'Pareggio', hunter: 'Ultimo colpo', mayorPass: 'Passaggio del titolo', active: 'Partita in corso',
      },
      winner: {
        village: 'Vince il villaggio', wolves: 'Vince il branco', lovers: 'Vincono gli innamorati', ended: 'Partita finita', eyebrow: 'Tutti i ruoli sono svelati',
        rounds: 'Turni giocati: {{rounds}}', results: 'Ruoli e punti', playerCount: 'Giocatori: {{count}}', you: 'Tu', place: 'Posto {{place}}', points: '{{score}} punti',
        rematch: 'Gioca ancora', join: 'Entra nella rivincita', waiting: 'Aspetto la rivincita',
      },
    },
  },
  pt: {
    roles: {
      villager: 'Aldeão', werewolf: 'Lobisomem', witch: 'Bruxa', seer: 'Vidente', hunter: 'Caçador', amor: 'Cupido',
      fool: 'Bobo da aldeia', girl: 'Menina', priest: 'Sacerdote', unknown: 'Papel desconhecido', hidden: 'Papel oculto',
    },
    game: {
      loading: 'A carregar o jogo', playerMissing: 'Jogador não encontrado', home: 'Menu principal', unknownPlayer: 'Desconhecido', mayor: 'Presidente',
      round: 'Ronda {{round}}', aliveCount: '{{alive}} de {{total}} vivos', village: 'Aldeia', activeCount: '{{count}} ativos',
      roleConfirm: 'Entendi o meu papel', roleSecret: 'Não mostres esta carta a ninguém.',
      lover: { label: 'A vossa ligação secreta', description: 'Estás ligado a {{name}}. Se um cair, o outro segue-o.' },
      notices: {
        wolfObserved: 'Alguém observou a alcateia esta noite.', invalidAction: 'Essa ação já não é válida. O jogo não mudou.',
        nightDeaths: '{{names}} morreu durante a noite.', invalidVote: 'Não foi possível aceitar esse voto.',
        actionSendFailed: 'Não foi possível enviar a ação. Tenta novamente.', peekSendFailed: 'Não foi possível enviar a espreitadela. Tenta novamente.',
        voteSendFailed: 'Não foi possível enviar o voto. Tenta novamente.',
      },
      events: {
        mayorElected: '{{name}} foi eleito presidente', diedAtNight: '{{name}} morreu durante a noite', healed: '{{name}} foi curado', poisoned: '{{name}} foi envenenado',
        foolRevealed: '{{name}} é o bobo da aldeia e perde o voto', eliminated: '{{name}} foi eliminado pela aldeia', decided: 'O jogo está decidido',
      },
      hunter: { eyebrow: 'Último tiro', title: 'Leva alguém contigo', description: 'Escolhe um jogador vivo. A decisão é final.' },
      mayorPass: { eyebrow: 'Último dever', title: 'Passa o título', description: 'Escolhe quem vai decidir os próximos empates.' },
      discussion: {
        eyebrow: 'A aldeia acorda', title: 'Hora de desconfiar', description: 'Comparem as histórias e decidam em quem confiar.',
        deaths: 'Mortos durante a noite: {{names}}', survived: 'Todos sobreviveram à noite.', startVote: 'Começar votação', waiting: 'O anfitrião vai iniciar a votação em breve.',
      },
      tie: {
        eyebrow: 'Empate', hostDecides: 'O anfitrião decide', mayorDecides: 'O presidente decide', choose: 'Escolhe apenas entre os jogadores empatados.',
        waitingHost: 'O anfitrião toma a decisão final.', waitingMayor: '{{name}} toma a decisão final.', defaultMayor: 'O presidente', resolving: 'Decisão em curso',
      },
      pending: { title: 'Falta uma última decisão', description: 'A ronda continua automaticamente depois.' },
      status: {
        night: 'Noite · {{phase}}', waiting: 'À espera', amor: 'Cupido', priest: 'Sacerdote', wolf: 'A alcateia', witch: 'A bruxa', seer: 'O vidente',
        discussion: 'Dia · Discussão', vote: 'Dia · Votação', election: 'Eleição do presidente', tie: 'Empate', hunter: 'Último tiro', mayorPass: 'Passagem do título', active: 'Jogo em curso',
      },
      winner: {
        village: 'A aldeia vence', wolves: 'A alcateia vence', lovers: 'Os amantes vencem', ended: 'Fim do jogo', eyebrow: 'Todos os papéis são revelados',
        rounds: 'Rondas jogadas: {{rounds}}', results: 'Papéis e pontos', playerCount: 'Jogadores: {{count}}', you: 'Tu', place: 'Lugar {{place}}', points: '{{score}} pontos',
        rematch: 'Jogar novamente', join: 'Entrar na desforra', waiting: 'À espera da desforra',
      },
    },
  },
  zh: {
    roles: {
      villager: '村民', werewolf: '狼人', witch: '女巫', seer: '预言家', hunter: '猎人', amor: '丘比特', fool: '白痴', girl: '小女孩', priest: '牧师', unknown: '未知角色', hidden: '角色已隐藏',
    },
    game: {
      loading: '正在加载游戏', playerMissing: '找不到玩家', home: '主菜单', unknownPlayer: '未知', mayor: '村长', round: '第 {{round}} 轮',
      aliveCount: '{{total}} 人中 {{alive}} 人存活', village: '村庄', activeCount: '{{count}} 人存活', roleConfirm: '我已了解角色', roleSecret: '不要把这张卡给任何人看。',
      lover: { label: '你们的秘密羁绊', description: '你与 {{name}} 相连。一人倒下，另一人也会跟随。' },
      notices: {
        wolfObserved: '今晚有人窥视了狼群。', invalidAction: '该操作已失效，游戏状态未改变。', nightDeaths: '{{names}} 在夜里死亡。', invalidVote: '无法接受该投票。',
        actionSendFailed: '操作发送失败，请重试。', peekSendFailed: '窥视请求发送失败，请重试。', voteSendFailed: '投票发送失败，请重试。',
      },
      events: {
        mayorElected: '{{name}} 当选村长', diedAtNight: '{{name}} 在夜里死亡', healed: '{{name}} 被治愈', poisoned: '{{name}} 被毒杀',
        foolRevealed: '{{name}} 是白痴并失去投票权', eliminated: '{{name}} 被村庄淘汰', decided: '游戏结果已确定',
      },
      hunter: { eyebrow: '最后一枪', title: '带走一个人', description: '选择一名存活玩家。决定无法撤回。' },
      mayorPass: { eyebrow: '最后职责', title: '交出头衔', description: '选择下一位负责处理平票的人。' },
      discussion: {
        eyebrow: '村庄醒来', title: '开始怀疑', description: '对照彼此的说法，决定还能相信谁。', deaths: '昨夜死亡：{{names}}', survived: '所有人都活过了昨夜。',
        startVote: '开始投票', waiting: '房主即将开始投票。',
      },
      tie: {
        eyebrow: '平票', hostDecides: '由房主决定', mayorDecides: '由村长决定', choose: '只能从平票玩家中选择。', waitingHost: '房主正在做最终决定。',
        waitingMayor: '{{name}} 正在做最终决定。', defaultMayor: '村长', resolving: '正在决定',
      },
      pending: { title: '还差最后一个决定', description: '完成后本轮将自动继续。' },
      status: {
        night: '夜晚 · {{phase}}', waiting: '等待中', amor: '丘比特', priest: '牧师', wolf: '狼群', witch: '女巫', seer: '预言家', discussion: '白天 · 讨论',
        vote: '白天 · 投票', election: '村长选举', tie: '平票', hunter: '最后一枪', mayorPass: '移交头衔', active: '游戏进行中',
      },
      winner: {
        village: '村庄获胜', wolves: '狼群获胜', lovers: '情侣获胜', ended: '游戏结束', eyebrow: '所有角色已揭晓', rounds: '进行轮数：{{rounds}}',
        results: '角色与分数', playerCount: '玩家：{{count}}', you: '你', place: '第 {{place}} 名', points: '{{score}} 分', rematch: '再玩一局', join: '加入下一局', waiting: '等待下一局',
      },
    },
  },
  ja: {
    roles: {
      villager: '村人', werewolf: '人狼', witch: '魔女', seer: '占い師', hunter: '狩人', amor: 'キューピッド', fool: '村の愚者', girl: '少女', priest: '司祭', unknown: '不明な役職', hidden: '役職は非公開',
    },
    game: {
      loading: 'ゲームを読み込み中', playerMissing: 'プレイヤーが見つかりません', home: 'メインメニュー', unknownPlayer: '不明', mayor: '村長', round: 'ラウンド {{round}}',
      aliveCount: '{{total}}人中{{alive}}人生存', village: '村', activeCount: '{{count}}人生存', roleConfirm: '役職を確認しました', roleSecret: 'このカードは誰にも見せないでください。',
      lover: { label: '二人だけの秘密の絆', description: 'あなたは {{name}} と結ばれています。一人が倒れると、もう一人も後を追います。' },
      notices: {
        wolfObserved: '今夜、誰かが人狼の群れを見ました。', invalidAction: 'その行動は無効です。ゲームの状態は変わっていません。', nightDeaths: '{{names}} が夜に死亡しました。',
        invalidVote: 'その投票は受け付けられませんでした。', actionSendFailed: '行動を送信できませんでした。もう一度お試しください。',
        peekSendFailed: 'のぞき見を送信できませんでした。もう一度お試しください。', voteSendFailed: '投票を送信できませんでした。もう一度お試しください。',
      },
      events: {
        mayorElected: '{{name}} が村長に選ばれました', diedAtNight: '{{name}} が夜に死亡しました', healed: '{{name}} は治療されました', poisoned: '{{name}} は毒を盛られました',
        foolRevealed: '{{name}} は村の愚者で投票権を失います', eliminated: '{{name}} は村から追放されました', decided: 'ゲームの決着がつきました',
      },
      hunter: { eyebrow: '最後の一発', title: '一人を道連れにする', description: '生存者を一人選んでください。この決定は取り消せません。' },
      mayorPass: { eyebrow: '最後の務め', title: '役職を引き継ぐ', description: '次の同票を裁定する人を選んでください。' },
      discussion: {
        eyebrow: '村が目覚める', title: '疑う時間です', description: 'それぞれの話を比べ、誰を信じるか決めましょう。', deaths: '昨夜の犠牲者：{{names}}',
        survived: '全員が夜を生き延びました。', startVote: '投票を始める', waiting: 'ホストがまもなく投票を始めます。',
      },
      tie: {
        eyebrow: '同票', hostDecides: 'ホストが決定', mayorDecides: '村長が決定', choose: '同票のプレイヤーから選んでください。', waitingHost: 'ホストが最終決定をしています。',
        waitingMayor: '{{name}} が最終決定をしています。', defaultMayor: '村長', resolving: '決定中',
      },
      pending: { title: '最後の決定を待っています', description: '完了後、ラウンドは自動で続きます。' },
      status: {
        night: '夜 · {{phase}}', waiting: '待機中', amor: 'キューピッド', priest: '司祭', wolf: '人狼の群れ', witch: '魔女', seer: '占い師', discussion: '昼 · 議論',
        vote: '昼 · 投票', election: '村長選挙', tie: '同票', hunter: '最後の一発', mayorPass: '村長交代', active: 'ゲーム進行中',
      },
      winner: {
        village: '村人陣営の勝利', wolves: '人狼陣営の勝利', lovers: '恋人たちの勝利', ended: 'ゲーム終了', eyebrow: 'すべての役職が公開されます',
        rounds: 'ラウンド数：{{rounds}}', results: '役職とスコア', playerCount: 'プレイヤー：{{count}}', you: 'あなた', place: '{{place}}位', points: '{{score}}点',
        rematch: 'もう一度遊ぶ', join: '再戦に参加', waiting: '再戦を待っています',
      },
    },
  },
  ko: {
    roles: {
      villager: '마을 주민', werewolf: '늑대인간', witch: '마녀', seer: '예언자', hunter: '사냥꾼', amor: '큐피드', fool: '마을 바보', girl: '소녀', priest: '사제', unknown: '알 수 없는 역할', hidden: '역할 숨김',
    },
    game: {
      loading: '게임 불러오는 중', playerMissing: '플레이어를 찾을 수 없습니다', home: '메인 메뉴', unknownPlayer: '알 수 없음', mayor: '촌장', round: '{{round}}라운드',
      aliveCount: '{{total}}명 중 {{alive}}명 생존', village: '마을', activeCount: '{{count}}명 생존', roleConfirm: '역할을 확인했습니다', roleSecret: '이 카드를 아무에게도 보여주지 마세요.',
      lover: { label: '두 사람의 비밀 인연', description: '{{name}} 님과 연결되었습니다. 한 사람이 쓰러지면 다른 사람도 뒤따릅니다.' },
      notices: {
        wolfObserved: '오늘 밤 누군가 늑대 무리를 지켜봤습니다.', invalidAction: '더 이상 유효하지 않은 행동입니다. 게임 상태는 바뀌지 않았습니다.',
        nightDeaths: '{{names}} 님이 밤에 사망했습니다.', invalidVote: '해당 투표를 받을 수 없습니다.', actionSendFailed: '행동을 보낼 수 없습니다. 다시 시도해 주세요.',
        peekSendFailed: '엿보기 요청을 보낼 수 없습니다. 다시 시도해 주세요.', voteSendFailed: '투표를 보낼 수 없습니다. 다시 시도해 주세요.',
      },
      events: {
        mayorElected: '{{name}} 님이 촌장으로 선출되었습니다', diedAtNight: '{{name}} 님이 밤에 사망했습니다', healed: '{{name}} 님이 치료되었습니다',
        poisoned: '{{name}} 님이 독살되었습니다', foolRevealed: '{{name}} 님은 마을 바보이며 투표권을 잃습니다', eliminated: '{{name}} 님이 마을에서 추방되었습니다', decided: '게임의 승패가 결정되었습니다',
      },
      hunter: { eyebrow: '마지막 한 발', title: '한 명을 데려가세요', description: '살아 있는 플레이어 한 명을 선택하세요. 되돌릴 수 없습니다.' },
      mayorPass: { eyebrow: '마지막 임무', title: '직책을 넘겨주세요', description: '다음 동점을 결정할 사람을 선택하세요.' },
      discussion: {
        eyebrow: '마을이 깨어납니다', title: '의심할 시간', description: '서로의 이야기를 비교하고 누구를 믿을지 정하세요.', deaths: '밤의 희생자: {{names}}',
        survived: '모두가 밤을 버텼습니다.', startVote: '투표 시작', waiting: '호스트가 곧 투표를 시작합니다.',
      },
      tie: {
        eyebrow: '동점', hostDecides: '호스트가 결정합니다', mayorDecides: '촌장이 결정합니다', choose: '동점인 플레이어 중에서만 선택하세요.',
        waitingHost: '호스트가 최종 결정을 내리고 있습니다.', waitingMayor: '{{name}} 님이 최종 결정을 내리고 있습니다.', defaultMayor: '촌장', resolving: '결정 중',
      },
      pending: { title: '마지막 결정이 남았습니다', description: '결정 후 라운드가 자동으로 계속됩니다.' },
      status: {
        night: '밤 · {{phase}}', waiting: '대기 중', amor: '큐피드', priest: '사제', wolf: '늑대 무리', witch: '마녀', seer: '예언자', discussion: '낮 · 토론',
        vote: '낮 · 투표', election: '촌장 선거', tie: '동점', hunter: '마지막 한 발', mayorPass: '직책 인계', active: '게임 진행 중',
      },
      winner: {
        village: '마을의 승리', wolves: '늑대 무리의 승리', lovers: '연인의 승리', ended: '게임 종료', eyebrow: '모든 역할이 공개됩니다', rounds: '진행한 라운드: {{rounds}}',
        results: '역할과 점수', playerCount: '플레이어: {{count}}', you: '나', place: '{{place}}위', points: '{{score}}점', rematch: '다시 하기', join: '재대결 참여', waiting: '재대결 대기 중',
      },
    },
  },
  ar: {
    roles: {
      villager: 'قروي', werewolf: 'مستذئب', witch: 'ساحرة', seer: 'عرّاف', hunter: 'صياد', amor: 'كيوبيد', fool: 'أحمق القرية', girl: 'الفتاة الصغيرة', priest: 'كاهن', unknown: 'دور غير معروف', hidden: 'الدور مخفي',
    },
    game: {
      loading: 'جارٍ تحميل اللعبة', playerMissing: 'لم يتم العثور على اللاعب', home: 'القائمة الرئيسية', unknownPlayer: 'غير معروف', mayor: 'العمدة', round: 'الجولة {{round}}',
      aliveCount: '{{alive}} من {{total}} على قيد الحياة', village: 'القرية', activeCount: '{{count}} أحياء', roleConfirm: 'فهمت دوري', roleSecret: 'لا تعرض هذه البطاقة لأي شخص.',
      lover: { label: 'رابطتكما السرية', description: 'أنت مرتبط بـ {{name}}. إذا سقط أحدكما، يتبعه الآخر.' },
      notices: {
        wolfObserved: 'راقب أحدهم القطيع هذه الليلة.', invalidAction: 'لم يعد هذا الإجراء صالحًا. لم تتغير اللعبة.', nightDeaths: 'مات {{names}} أثناء الليل.',
        invalidVote: 'تعذر قبول هذا التصويت.', actionSendFailed: 'تعذر إرسال الإجراء. حاول مرة أخرى.', peekSendFailed: 'تعذر إرسال النظرة. حاول مرة أخرى.',
        voteSendFailed: 'تعذر إرسال التصويت. حاول مرة أخرى.',
      },
      events: {
        mayorElected: 'تم انتخاب {{name}} عمدة', diedAtNight: 'مات {{name}} أثناء الليل', healed: 'تم علاج {{name}}', poisoned: 'تم تسميم {{name}}',
        foolRevealed: '{{name}} هو أحمق القرية ويفقد حق التصويت', eliminated: 'أقصت القرية {{name}}', decided: 'حُسمت اللعبة',
      },
      hunter: { eyebrow: 'الطلقة الأخيرة', title: 'خذ شخصًا معك', description: 'اختر لاعبًا حيًا. هذا القرار نهائي.' },
      mayorPass: { eyebrow: 'المهمة الأخيرة', title: 'مرر اللقب', description: 'اختر من سيحسم حالات التعادل القادمة.' },
      discussion: {
        eyebrow: 'تستيقظ القرية', title: 'وقت الشك', description: 'قارنوا قصصكم وقرروا بمن تثقون.', deaths: 'ضحايا الليل: {{names}}', survived: 'نجا الجميع من الليل.',
        startVote: 'بدء التصويت', waiting: 'سيبدأ المضيف التصويت قريبًا.',
      },
      tie: {
        eyebrow: 'تعادل', hostDecides: 'المضيف يقرر', mayorDecides: 'العمدة يقرر', choose: 'اختر فقط من اللاعبين المتعادلين.', waitingHost: 'يتخذ المضيف القرار النهائي.',
        waitingMayor: 'يتخذ {{name}} القرار النهائي.', defaultMayor: 'العمدة', resolving: 'جارٍ اتخاذ القرار',
      },
      pending: { title: 'تبقى قرار أخير', description: 'ستستمر الجولة تلقائيًا بعده.' },
      status: {
        night: 'الليل · {{phase}}', waiting: 'انتظار', amor: 'كيوبيد', priest: 'الكاهن', wolf: 'القطيع', witch: 'الساحرة', seer: 'العرّاف', discussion: 'النهار · نقاش',
        vote: 'النهار · تصويت', election: 'انتخاب العمدة', tie: 'تعادل', hunter: 'الطلقة الأخيرة', mayorPass: 'تسليم اللقب', active: 'اللعبة جارية',
      },
      winner: {
        village: 'القرية تفوز', wolves: 'القطيع يفوز', lovers: 'العاشقان يفوزان', ended: 'انتهت اللعبة', eyebrow: 'تم كشف جميع الأدوار', rounds: 'الجولات: {{rounds}}',
        results: 'الأدوار والنقاط', playerCount: 'اللاعبون: {{count}}', you: 'أنت', place: 'المركز {{place}}', points: '{{score}} نقطة', rematch: 'العب مجددًا', join: 'انضم إلى الإعادة', waiting: 'في انتظار الإعادة',
      },
    },
  },
} as const
