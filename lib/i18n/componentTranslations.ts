const en = {
  components: {
    admin: {
      settings: 'Settings',
      saving: 'Saving',
      votesLabel: 'Show votes openly',
      votesDescription: 'Everyone can see who voted for whom.',
      mayorLabel: 'Elect a mayor',
      mayorDescription: 'Breaks ties and passes on the title.',
      autoLabel: 'Assign roles automatically',
      autoDescription: 'Adapts the setup to the group size.',
      roles: 'Role setup',
      decreaseRole: 'Reduce {{role}}',
      increaseRole: 'Add {{role}}',
      minimumPlayers: 'At least 5 players are required',
      minimumWolf: 'Add at least one werewolf',
      wolfBalance: 'Werewolves must remain the minority',
      ready: 'Role setup is ready',
      excessRoles: 'Role count is {{count}} too high',
      missingRoles: 'Role count is {{count}} too low',
      preparing: 'Preparing game',
      start: 'Start game',
    },
    gameLog: {
      title: 'Events',
      ariaLabel: 'Game events',
    },
    miniGame: {
      title: 'Night watch',
      points: 'Score: {{count}}',
      paused: 'Paused — it is your turn',
      board: 'Night watch board',
      tileActionGain: 'Tap {{label}}, score +{{count}}',
      tileActionLose: 'Tap {{label}}, score −{{count}}',
      tiles: {
        coin: 'Coin',
        bomb: 'Trap',
        star: 'Star',
      },
    },
    night: {
      sleepingTitle: 'The village is asleep',
      sleepingDescription: 'Wait until your role is called.',
      actionSent: 'Action sent safely.',
      waitingOthers: 'Waiting for the other roles.',
      amor: {
        title: 'Link two hearts',
        description: 'Choose two different players. Their bond stays secret.',
        confirm: 'Confirm lovers',
      },
      priest: {
        used: 'The blessing has already been used this game.',
        title: 'Protection for tonight',
        description: 'The blessing blocks one attack from the pack.',
        confirm: 'Give blessing',
      },
      wolf: {
        title: 'The pack chooses',
        description: 'Agree on a victim. Werewolves cannot target each other.',
        voteLabel: 'Pack vote',
        voted: 'Voted',
        waiting: 'Still choosing',
        target: 'Target: {{name}}',
        confirm: 'Confirm target',
      },
      girl: {
        title: 'Take a quick look',
        description: 'You may watch the pack once tonight.',
        warning: 'The pack might notice your movement.',
        peek: 'Look carefully',
        resultTitle: 'You identified the pack',
        keepSecret: 'Keep this knowledge for the coming day.',
        alreadyPeeked: 'You already looked tonight.',
      },
      witch: {
        poisonTitle: 'Poison potion',
        poisonDescription: 'Choose who the potion should hit tonight.',
        back: 'Back',
        poison: 'Poison',
        title: 'The witch wakes',
        description: 'Use both potions tonight, or end your turn.',
        packTarget: "Pack's target",
        noAttack: 'No one was attacked',
        healUsed: 'Healing potion used',
        healSpent: 'Healing potion unavailable',
        healTarget: 'Heal {{name}}',
        choosePoison: 'Choose poison target',
        poisonUsed: 'Poison potion used',
        poisonSpent: 'Poison potion unavailable',
        finish: 'Finish night turn',
      },
      seer: {
        visionTitle: 'Your vision',
        visionDescription: 'Only you can see this result.',
        wolf: 'Member of the pack',
        safe: 'Not a werewolf',
        title: 'Look behind the mask',
        description: 'Whose true role do you want to reveal?',
        reveal: 'Reveal role',
      },
    },
    playerList: {
      dead: 'Dead',
      you: 'You',
      mayor: 'Mayor',
      noVote: 'Cannot vote',
      selected: 'Selected',
    },
    roleCard: {
      revealLabel: 'Reveal secret role',
      private: 'For your eyes only',
      secretRole: 'Your secret role',
      tapToReveal: 'Tap to reveal',
      youAre: 'You are',
      mayor: 'Mayor',
      player: 'Player',
      descriptions: {
        villager: 'Find the werewolves and convince the village before it is too late.',
        werewolf: 'Choose a victim at night and stay unnoticed during the day.',
        witch: 'One healing potion and one poison potion can change the night.',
        seer: "Discover one player's true side each night.",
        hunter: 'If you fall, you may take one final shot.',
        amor: 'Link two fates during the first night.',
        fool: 'The vote exposes you, but only takes away your vote.',
        girl: 'Watch the pack in secret and risk being noticed.',
        priest: 'A one-time blessing protects against the pack.',
      },
    },
    scoreBoard: {
      title: 'Night watch leaderboard',
      ariaLabel: 'Night watch leaderboard',
      place: 'Place {{place}}',
      points: 'Score: {{count}}',
    },
    vote: {
      mayorElection: 'Mayor election',
      tiebreaker: 'Tie — mayor decides',
      vote: 'Vote',
      cast: 'Votes: {{cast}} / {{total}}',
      noVote: 'You cannot vote as the Village Fool',
      mayor: 'Mayor',
      yourVote: 'Your vote',
      waiting: 'Waiting for all votes…',
    },
    error: {
      eyebrow: 'Connection interrupted',
      title: 'The game lost its rhythm',
      description: 'Reload the round. Your local game state will stay safe.',
      retry: 'Try again',
      home: 'Main menu',
    },
  },
} as const

type TranslationShape<T> = {
  [Key in keyof T]: T[Key] extends string ? string : TranslationShape<T[Key]>
}

const de = {
  components: {
    admin: {
      settings: 'Einstellungen', saving: 'Speichert', votesLabel: 'Stimmen offen anzeigen', votesDescription: 'Alle sehen, wer für wen stimmt.',
      mayorLabel: 'Bürgermeister wählen', mayorDescription: 'Entscheidet Gleichstände und gibt den Titel weiter.',
      autoLabel: 'Rollen automatisch verteilen', autoDescription: 'Passt die Zusammenstellung an die Gruppengröße an.', roles: 'Rollenverteilung',
      decreaseRole: '{{role}} reduzieren', increaseRole: '{{role}} hinzufügen', minimumPlayers: 'Mindestens 5 Spieler benötigt',
      minimumWolf: 'Mindestens ein Werwolf fehlt', wolfBalance: 'Werwölfe müssen in der Minderheit bleiben', ready: 'Rollenverteilung ist bereit', excessRoles: 'Rollenzahl ist um {{count}} zu hoch',
      missingRoles: 'Rollenzahl ist um {{count}} zu niedrig', preparing: 'Spiel wird vorbereitet', start: 'Spiel starten',
    },
    gameLog: { title: 'Ereignisse', ariaLabel: 'Spielereignisse' },
    miniGame: {
      title: 'Nachtwache', points: 'Punktestand: {{count}}', paused: 'Pausiert — du bist gerade am Zug', board: 'Nachtwache-Spielfeld',
      tileActionGain: '{{label}} antippen, Punktestand +{{count}}', tileActionLose: '{{label}} antippen, Punktestand −{{count}}',
      tiles: { coin: 'Münze', bomb: 'Falle', star: 'Stern' },
    },
    night: {
      sleepingTitle: 'Das Dorf schläft', sleepingDescription: 'Warte, bis deine Rolle aufgerufen wird.', actionSent: 'Aktion sicher übermittelt.', waitingOthers: 'Warte auf die anderen Rollen.',
      amor: { title: 'Zwei Herzen verbinden', description: 'Wähle zwei unterschiedliche Spieler. Ihre Verbindung bleibt geheim.', confirm: 'Liebespaar bestätigen' },
      priest: { used: 'Der Segen wurde in diesem Spiel bereits eingesetzt.', title: 'Schutz für diese Nacht', description: 'Der Segen wehrt einen Angriff des Rudels ab.', confirm: 'Segen erteilen' },
      wolf: { title: 'Das Rudel wählt', description: 'Einigt euch auf ein Opfer. Werwölfe können einander nicht wählen.', voteLabel: 'Abstimmung des Rudels', voted: 'Hat gewählt', waiting: 'Wählt noch', target: 'Ziel: {{name}}', confirm: 'Ziel bestätigen' },
      girl: { title: 'Ein kurzer Blick', description: 'Du kannst das Rudel einmal in dieser Nacht beobachten.', warning: 'Das Rudel könnte deine Bewegung bemerken.', peek: 'Vorsichtig hinsehen', resultTitle: 'Du hast das Rudel erkannt', keepSecret: 'Behalte dein Wissen für den kommenden Tag.', alreadyPeeked: 'Du hast in dieser Nacht bereits hingesehen.' },
      witch: { poisonTitle: 'Gifttrank', poisonDescription: 'Wähle, wen der Trank in dieser Nacht treffen soll.', back: 'Zurück', poison: 'Vergiften', title: 'Die Hexe erwacht', description: 'Nutze beide Tränke oder beende deinen Zug.', packTarget: 'Ziel des Rudels', noAttack: 'Niemand wurde angegriffen', healUsed: 'Heiltrank eingesetzt', healSpent: 'Heiltrank verbraucht', healTarget: '{{name}} heilen', choosePoison: 'Giftziel wählen', poisonUsed: 'Gifttrank eingesetzt', poisonSpent: 'Gifttrank verbraucht', finish: 'Nachtzug abschließen' },
      seer: { visionTitle: 'Deine Vision', visionDescription: 'Nur du siehst dieses Ergebnis.', wolf: 'Gehört zum Rudel', safe: 'Kein Werwolf', title: 'Blick hinter die Maske', description: 'Wessen wahre Rolle möchtest du erkennen?', reveal: 'Rolle erkennen' },
    },
    playerList: { dead: 'Verstorben', you: 'Du', mayor: 'Bürgermeister', noVote: 'Kein Stimmrecht', selected: 'Ausgewählt' },
    roleCard: {
      revealLabel: 'Geheime Rolle aufdecken', private: 'Nur für deine Augen', secretRole: 'Deine geheime Rolle', tapToReveal: 'Zum Aufdecken tippen', youAre: 'Du bist', mayor: 'Bürgermeister', player: 'Spieler',
      descriptions: { villager: 'Finde die Werwölfe und überzeuge das Dorf, bevor es zu spät ist.', werewolf: 'Wählt nachts ein Opfer und bleibt am Tag unauffällig.', witch: 'Ein Heiltrank und ein Gifttrank können die Nacht verändern.', seer: 'Erkenne jede Nacht die wahre Seite eines Mitspielers.', hunter: 'Wenn du fällst, darfst du noch einen letzten Schuss abgeben.', amor: 'Verbinde in der ersten Nacht zwei Schicksale.', fool: 'Die Abstimmung entlarvt dich, nimmt dir aber nur dein Stimmrecht.', girl: 'Beobachte das Rudel heimlich und riskiere, entdeckt zu werden.', priest: 'Ein einmaliger Segen schützt vor dem Rudel.' },
    },
    scoreBoard: { title: 'Nachtwache-Bestenliste', ariaLabel: 'Nachtwache-Bestenliste', place: 'Platz {{place}}', points: 'Punktestand: {{count}}' },
    vote: { mayorElection: 'Bürgermeisterwahl', tiebreaker: 'Gleichstand — Bürgermeister entscheidet', vote: 'Abstimmung', cast: 'Abgestimmt: {{cast}} / {{total}}', noVote: 'Als Dorfdepp hast du kein Stimmrecht', mayor: 'Bürgermeister', yourVote: 'Deine Stimme', waiting: 'Warten auf alle Stimmen…' },
    error: { eyebrow: 'Verbindung unterbrochen', title: 'Das Spiel ist kurz aus dem Takt', description: 'Lade die Runde erneut. Dein lokaler Spielstand bleibt erhalten.', retry: 'Erneut versuchen', home: 'Hauptmenü' },
  },
} satisfies TranslationShape<typeof en>

const es = {
  components: {
    admin: {
      settings: 'Ajustes', saving: 'Guardando', votesLabel: 'Mostrar los votos', votesDescription: 'Todos pueden ver quién votó a quién.',
      mayorLabel: 'Elegir alcalde', mayorDescription: 'Resuelve los empates y entrega el cargo.', autoLabel: 'Asignar roles automáticamente',
      autoDescription: 'Adapta la partida al tamaño del grupo.', roles: 'Configuración de roles', decreaseRole: 'Quitar {{role}}', increaseRole: 'Añadir {{role}}',
      minimumPlayers: 'Se necesitan al menos 5 jugadores', minimumWolf: 'Añade al menos un hombre lobo', wolfBalance: 'Los hombres lobo deben ser minoría', ready: 'Los roles están listos',
      excessRoles: 'Roles de más: {{count}}', missingRoles: 'Roles por cubrir: {{count}}', preparing: 'Preparando partida', start: 'Empezar partida',
    },
    gameLog: { title: 'Eventos', ariaLabel: 'Eventos de la partida' },
    miniGame: { title: 'Guardia nocturna', points: 'Puntuación: {{count}}', paused: 'En pausa — es tu turno', board: 'Tablero de guardia nocturna', tileActionGain: 'Toca {{label}}, puntuación +{{count}}', tileActionLose: 'Toca {{label}}, puntuación −{{count}}', tiles: { coin: 'Moneda', bomb: 'Trampa', star: 'Estrella' } },
    night: {
      sleepingTitle: 'El pueblo duerme', sleepingDescription: 'Espera hasta que llamen a tu rol.', actionSent: 'Acción enviada.', waitingOthers: 'Esperando a los demás roles.',
      amor: { title: 'Une dos corazones', description: 'Elige dos jugadores distintos. Su vínculo será secreto.', confirm: 'Confirmar enamorados' },
      priest: { used: 'La bendición ya se usó en esta partida.', title: 'Protección para esta noche', description: 'La bendición bloquea un ataque de la manada.', confirm: 'Dar bendición' },
      wolf: { title: 'La manada elige', description: 'Acordad una víctima. Los lobos no pueden elegirse entre sí.', voteLabel: 'Voto de la manada', voted: 'Ha votado', waiting: 'Está eligiendo', target: 'Objetivo: {{name}}', confirm: 'Confirmar objetivo' },
      girl: { title: 'Mira un instante', description: 'Puedes observar a la manada una vez esta noche.', warning: 'La manada podría notar tu movimiento.', peek: 'Mirar con cuidado', resultTitle: 'Has identificado a la manada', keepSecret: 'Guarda este secreto para el próximo día.', alreadyPeeked: 'Ya has mirado esta noche.' },
      witch: { poisonTitle: 'Poción de veneno', poisonDescription: 'Elige a quién alcanzará la poción esta noche.', back: 'Volver', poison: 'Envenenar', title: 'La bruja despierta', description: 'Usa las dos pociones o termina tu turno.', packTarget: 'Objetivo de la manada', noAttack: 'Nadie fue atacado', healUsed: 'Poción curativa usada', healSpent: 'Poción curativa agotada', healTarget: 'Curar a {{name}}', choosePoison: 'Elegir objetivo del veneno', poisonUsed: 'Poción de veneno usada', poisonSpent: 'Poción de veneno agotada', finish: 'Terminar turno nocturno' },
      seer: { visionTitle: 'Tu visión', visionDescription: 'Solo tú puedes ver el resultado.', wolf: 'Es de la manada', safe: 'No es un hombre lobo', title: 'Mira tras la máscara', description: '¿Qué rol verdadero quieres descubrir?', reveal: 'Descubrir rol' },
    },
    playerList: { dead: 'Muerto', you: 'Tú', mayor: 'Alcalde', noVote: 'Sin voto', selected: 'Seleccionado' },
    roleCard: {
      revealLabel: 'Revelar rol secreto', private: 'Solo para tus ojos', secretRole: 'Tu rol secreto', tapToReveal: 'Toca para revelar', youAre: 'Eres', mayor: 'Alcalde', player: 'Jugador',
      descriptions: { villager: 'Encuentra a los lobos y convence al pueblo antes de que sea tarde.', werewolf: 'Elige una víctima de noche y pasa desapercibido de día.', witch: 'Una poción curativa y otra venenosa pueden cambiar la noche.', seer: 'Descubre el bando real de un jugador cada noche.', hunter: 'Si caes, puedes hacer un último disparo.', amor: 'Une dos destinos durante la primera noche.', fool: 'El voto te descubre, pero solo pierdes tu voto.', girl: 'Observa a la manada en secreto y arriesga ser vista.', priest: 'Una bendición única protege de la manada.' },
    },
    scoreBoard: { title: 'Clasificación de la guardia', ariaLabel: 'Clasificación de la guardia nocturna', place: 'Puesto {{place}}', points: 'Puntuación: {{count}}' },
    vote: { mayorElection: 'Elección de alcalde', tiebreaker: 'Empate — decide el alcalde', vote: 'Votación', cast: 'Votos: {{cast}} / {{total}}', noVote: 'El tonto del pueblo no puede votar', mayor: 'Alcalde', yourVote: 'Tu voto', waiting: 'Esperando todos los votos…' },
    error: { eyebrow: 'Conexión interrumpida', title: 'La partida perdió el ritmo', description: 'Recarga la ronda. Tu partida local seguirá a salvo.', retry: 'Intentar otra vez', home: 'Menú principal' },
  },
} satisfies TranslationShape<typeof en>

const fr = {
  components: {
    admin: {
      settings: 'Réglages', saving: 'Enregistrement', votesLabel: 'Afficher les votes', votesDescription: 'Tout le monde voit qui vote pour qui.',
      mayorLabel: 'Élire un maire', mayorDescription: 'Départage les votes et transmet le titre.', autoLabel: 'Attribuer les rôles automatiquement',
      autoDescription: 'Adapte la partie à la taille du groupe.', roles: 'Configuration des rôles', decreaseRole: 'Retirer {{role}}', increaseRole: 'Ajouter {{role}}',
      minimumPlayers: 'Il faut au moins 5 joueurs', minimumWolf: 'Ajoutez au moins un loup-garou', wolfBalance: 'Les loups-garous doivent rester minoritaires', ready: 'Les rôles sont prêts',
      excessRoles: 'Rôles en trop : {{count}}', missingRoles: 'Rôles à ajouter : {{count}}', preparing: 'Préparation de la partie', start: 'Lancer la partie',
    },
    gameLog: { title: 'Événements', ariaLabel: 'Événements de la partie' },
    miniGame: { title: 'Veille nocturne', points: 'Score : {{count}}', paused: "En pause — c'est votre tour", board: 'Plateau de veille nocturne', tileActionGain: 'Touchez {{label}}, score +{{count}}', tileActionLose: 'Touchez {{label}}, score −{{count}}', tiles: { coin: 'Pièce', bomb: 'Piège', star: 'Étoile' } },
    night: {
      sleepingTitle: 'Le village dort', sleepingDescription: "Attendez l'appel de votre rôle.", actionSent: 'Action envoyée.', waitingOthers: 'En attente des autres rôles.',
      amor: { title: 'Liez deux cœurs', description: 'Choisissez deux joueurs différents. Leur lien reste secret.', confirm: 'Confirmer les amoureux' },
      priest: { used: 'La bénédiction a déjà été utilisée.', title: 'Protection pour cette nuit', description: 'La bénédiction bloque une attaque de la meute.', confirm: 'Donner la bénédiction' },
      wolf: { title: 'La meute choisit', description: 'Entendez-vous sur une victime. Les loups ne peuvent pas se viser.', voteLabel: 'Vote de la meute', voted: 'A voté', waiting: 'Choisit encore', target: 'Cible : {{name}}', confirm: 'Confirmer la cible' },
      girl: { title: 'Jetez un rapide coup d’œil', description: 'Vous pouvez observer la meute une fois cette nuit.', warning: 'La meute pourrait remarquer votre mouvement.', peek: 'Regarder prudemment', resultTitle: 'Vous avez reconnu la meute', keepSecret: 'Gardez ce secret pour le jour à venir.', alreadyPeeked: 'Vous avez déjà regardé cette nuit.' },
      witch: { poisonTitle: 'Potion de poison', poisonDescription: 'Choisissez qui la potion touchera cette nuit.', back: 'Retour', poison: 'Empoisonner', title: 'La sorcière se réveille', description: 'Utilisez les deux potions ou terminez votre tour.', packTarget: 'Cible de la meute', noAttack: "Personne n'a été attaqué", healUsed: 'Potion de soin utilisée', healSpent: 'Potion de soin épuisée', healTarget: 'Soigner {{name}}', choosePoison: 'Choisir la cible du poison', poisonUsed: 'Potion de poison utilisée', poisonSpent: 'Potion de poison épuisée', finish: 'Terminer le tour de nuit' },
      seer: { visionTitle: 'Votre vision', visionDescription: 'Vous seul voyez ce résultat.', wolf: 'Membre de la meute', safe: "Ce n'est pas un loup-garou", title: 'Regardez derrière le masque', description: 'Quel rôle véritable voulez-vous découvrir ?', reveal: 'Révéler le rôle' },
    },
    playerList: { dead: 'Mort', you: 'Vous', mayor: 'Maire', noVote: 'Sans vote', selected: 'Sélectionné' },
    roleCard: {
      revealLabel: 'Révéler le rôle secret', private: 'Pour vos yeux seulement', secretRole: 'Votre rôle secret', tapToReveal: 'Touchez pour révéler', youAre: 'Vous êtes', mayor: 'Maire', player: 'Joueur',
      descriptions: { villager: "Trouvez les loups et convainquez le village avant qu'il ne soit trop tard.", werewolf: 'Choisissez une victime la nuit et restez discret le jour.', witch: 'Une potion de soin et une de poison peuvent changer la nuit.', seer: "Découvrez le véritable camp d'un joueur chaque nuit.", hunter: 'Si vous tombez, vous pouvez tirer une dernière fois.', amor: 'Liez deux destins pendant la première nuit.', fool: 'Le vote vous révèle, mais vous perdez seulement votre voix.', girl: "Observez la meute en secret au risque d'être vue.", priest: 'Une bénédiction unique protège de la meute.' },
    },
    scoreBoard: { title: 'Classement de la veille', ariaLabel: 'Classement de la veille nocturne', place: 'Place {{place}}', points: 'Score : {{count}}' },
    vote: { mayorElection: 'Élection du maire', tiebreaker: 'Égalité — le maire décide', vote: 'Vote', cast: 'Votes : {{cast}} / {{total}}', noVote: "L'idiot du village ne peut pas voter", mayor: 'Maire', yourVote: 'Votre vote', waiting: 'En attente de tous les votes…' },
    error: { eyebrow: 'Connexion interrompue', title: 'La partie a perdu le rythme', description: 'Rechargez la manche. Votre partie locale reste intacte.', retry: 'Réessayer', home: 'Menu principal' },
  },
} satisfies TranslationShape<typeof en>

const it = {
  components: {
    admin: {
      settings: 'Impostazioni', saving: 'Salvataggio', votesLabel: 'Mostra i voti', votesDescription: 'Tutti vedono chi ha votato per chi.',
      mayorLabel: 'Eleggi il sindaco', mayorDescription: 'Decide i pareggi e passa il titolo.', autoLabel: 'Assegna i ruoli automaticamente',
      autoDescription: 'Adatta la partita alle dimensioni del gruppo.', roles: 'Configurazione dei ruoli', decreaseRole: 'Rimuovi {{role}}', increaseRole: 'Aggiungi {{role}}',
      minimumPlayers: 'Servono almeno 5 giocatori', minimumWolf: 'Aggiungi almeno un lupo mannaro', wolfBalance: 'I lupi mannari devono restare in minoranza', ready: 'I ruoli sono pronti',
      excessRoles: 'Ruoli in più: {{count}}', missingRoles: 'Ruoli da aggiungere: {{count}}', preparing: 'Preparo la partita', start: 'Inizia partita',
    },
    gameLog: { title: 'Eventi', ariaLabel: 'Eventi della partita' },
    miniGame: { title: 'Guardia notturna', points: 'Punteggio: {{count}}', paused: 'In pausa — tocca a te', board: 'Tabellone della guardia notturna', tileActionGain: 'Tocca {{label}}, punteggio +{{count}}', tileActionLose: 'Tocca {{label}}, punteggio −{{count}}', tiles: { coin: 'Moneta', bomb: 'Trappola', star: 'Stella' } },
    night: {
      sleepingTitle: 'Il villaggio dorme', sleepingDescription: 'Aspetta che venga chiamato il tuo ruolo.', actionSent: 'Azione inviata.', waitingOthers: 'Aspetto gli altri ruoli.',
      amor: { title: 'Unisci due cuori', description: 'Scegli due giocatori diversi. Il loro legame resta segreto.', confirm: 'Conferma gli innamorati' },
      priest: { used: 'La benedizione è già stata usata.', title: 'Protezione per stanotte', description: 'La benedizione blocca un attacco del branco.', confirm: 'Dai la benedizione' },
      wolf: { title: 'Il branco sceglie', description: 'Scegliete una vittima. I lupi non possono colpirsi tra loro.', voteLabel: 'Voto del branco', voted: 'Ha votato', waiting: 'Sta scegliendo', target: 'Bersaglio: {{name}}', confirm: 'Conferma bersaglio' },
      girl: { title: 'Dai una rapida occhiata', description: 'Puoi osservare il branco una volta stanotte.', warning: 'Il branco potrebbe notare il tuo movimento.', peek: 'Guarda con attenzione', resultTitle: 'Hai riconosciuto il branco', keepSecret: 'Tieni questo segreto per il giorno che arriva.', alreadyPeeked: 'Hai già guardato stanotte.' },
      witch: { poisonTitle: 'Pozione velenosa', poisonDescription: 'Scegli chi colpire con la pozione stanotte.', back: 'Indietro', poison: 'Avvelena', title: 'La strega si sveglia', description: 'Usa entrambe le pozioni o termina il turno.', packTarget: 'Bersaglio del branco', noAttack: 'Nessuno è stato attaccato', healUsed: 'Pozione curativa usata', healSpent: 'Pozione curativa finita', healTarget: 'Cura {{name}}', choosePoison: 'Scegli il bersaglio del veleno', poisonUsed: 'Pozione velenosa usata', poisonSpent: 'Pozione velenosa finita', finish: 'Termina turno notturno' },
      seer: { visionTitle: 'La tua visione', visionDescription: 'Solo tu puoi vedere il risultato.', wolf: 'Fa parte del branco', safe: 'Non è un lupo mannaro', title: 'Guarda dietro la maschera', description: 'Quale vero ruolo vuoi scoprire?', reveal: 'Scopri ruolo' },
    },
    playerList: { dead: 'Morto', you: 'Tu', mayor: 'Sindaco', noVote: 'Non può votare', selected: 'Selezionato' },
    roleCard: {
      revealLabel: 'Scopri il ruolo segreto', private: 'Solo per i tuoi occhi', secretRole: 'Il tuo ruolo segreto', tapToReveal: 'Tocca per scoprire', youAre: 'Sei', mayor: 'Sindaco', player: 'Giocatore',
      descriptions: { villager: 'Trova i lupi e convinci il villaggio prima che sia troppo tardi.', werewolf: 'Scegli una vittima di notte e non farti notare di giorno.', witch: 'Una pozione curativa e una velenosa possono cambiare la notte.', seer: 'Scopri il vero schieramento di un giocatore ogni notte.', hunter: 'Se cadi, puoi sparare un ultimo colpo.', amor: 'Unisci due destini durante la prima notte.', fool: 'Il voto ti rivela, ma perdi solo il diritto di voto.', girl: 'Osserva il branco in segreto e rischia di essere scoperta.', priest: 'Una benedizione protegge dal branco una sola volta.' },
    },
    scoreBoard: { title: 'Classifica della guardia', ariaLabel: 'Classifica della guardia notturna', place: 'Posto {{place}}', points: 'Punteggio: {{count}}' },
    vote: { mayorElection: 'Elezione del sindaco', tiebreaker: 'Pareggio — decide il sindaco', vote: 'Votazione', cast: 'Voti: {{cast}} / {{total}}', noVote: 'Il matto del villaggio non può votare', mayor: 'Sindaco', yourVote: 'Il tuo voto', waiting: 'Aspetto tutti i voti…' },
    error: { eyebrow: 'Connessione interrotta', title: 'La partita ha perso il ritmo', description: 'Ricarica il turno. La partita locale resta al sicuro.', retry: 'Riprova', home: 'Menu principale' },
  },
} satisfies TranslationShape<typeof en>

const pt = {
  components: {
    admin: {
      settings: 'Configurações', saving: 'Salvando', votesLabel: 'Mostrar os votos', votesDescription: 'Todos veem quem votou em quem.',
      mayorLabel: 'Eleger prefeito', mayorDescription: 'Resolve empates e passa o título.', autoLabel: 'Distribuir papéis automaticamente',
      autoDescription: 'Adapta a partida ao tamanho do grupo.', roles: 'Configuração de papéis', decreaseRole: 'Remover {{role}}', increaseRole: 'Adicionar {{role}}',
      minimumPlayers: 'São necessários pelo menos 5 jogadores', minimumWolf: 'Adicione pelo menos um lobisomem', wolfBalance: 'Os lobisomens devem continuar em minoria', ready: 'Os papéis estão prontos',
      excessRoles: 'Papéis a mais: {{count}}', missingRoles: 'Papéis a adicionar: {{count}}', preparing: 'Preparando partida', start: 'Começar partida',
    },
    gameLog: { title: 'Eventos', ariaLabel: 'Eventos da partida' },
    miniGame: { title: 'Vigília noturna', points: 'Pontuação: {{count}}', paused: 'Pausado — é sua vez', board: 'Tabuleiro da vigília noturna', tileActionGain: 'Toque em {{label}}, pontuação +{{count}}', tileActionLose: 'Toque em {{label}}, pontuação −{{count}}', tiles: { coin: 'Moeda', bomb: 'Armadilha', star: 'Estrela' } },
    night: {
      sleepingTitle: 'A vila dorme', sleepingDescription: 'Espere até chamarem seu papel.', actionSent: 'Ação enviada.', waitingOthers: 'Esperando os outros papéis.',
      amor: { title: 'Una dois corações', description: 'Escolha dois jogadores diferentes. O vínculo fica secreto.', confirm: 'Confirmar casal' },
      priest: { used: 'A bênção já foi usada nesta partida.', title: 'Proteção para esta noite', description: 'A bênção bloqueia um ataque da alcateia.', confirm: 'Dar bênção' },
      wolf: { title: 'A alcateia escolhe', description: 'Escolham uma vítima. Lobisomens não podem atacar uns aos outros.', voteLabel: 'Voto da alcateia', voted: 'Votou', waiting: 'Ainda escolhendo', target: 'Alvo: {{name}}', confirm: 'Confirmar alvo' },
      girl: { title: 'Dê uma olhada rápida', description: 'Você pode observar a alcateia uma vez esta noite.', warning: 'A alcateia pode notar seu movimento.', peek: 'Olhar com cuidado', resultTitle: 'Você reconheceu a alcateia', keepSecret: 'Guarde este segredo para o próximo dia.', alreadyPeeked: 'Você já olhou esta noite.' },
      witch: { poisonTitle: 'Poção de veneno', poisonDescription: 'Escolha quem a poção deve atingir esta noite.', back: 'Voltar', poison: 'Envenenar', title: 'A bruxa acorda', description: 'Use as duas poções ou encerre seu turno.', packTarget: 'Alvo da alcateia', noAttack: 'Ninguém foi atacado', healUsed: 'Poção de cura usada', healSpent: 'Poção de cura esgotada', healTarget: 'Curar {{name}}', choosePoison: 'Escolher alvo do veneno', poisonUsed: 'Poção de veneno usada', poisonSpent: 'Poção de veneno esgotada', finish: 'Encerrar turno noturno' },
      seer: { visionTitle: 'Sua visão', visionDescription: 'Só você pode ver o resultado.', wolf: 'Faz parte da alcateia', safe: 'Não é lobisomem', title: 'Olhe por trás da máscara', description: 'Qual papel verdadeiro você quer revelar?', reveal: 'Revelar papel' },
    },
    playerList: { dead: 'Morto', you: 'Você', mayor: 'Prefeito', noVote: 'Sem voto', selected: 'Selecionado' },
    roleCard: {
      revealLabel: 'Revelar papel secreto', private: 'Só para você', secretRole: 'Seu papel secreto', tapToReveal: 'Toque para revelar', youAre: 'Você é', mayor: 'Prefeito', player: 'Jogador',
      descriptions: { villager: 'Encontre os lobisomens e convença a vila antes que seja tarde.', werewolf: 'Escolha uma vítima à noite e passe despercebido durante o dia.', witch: 'Uma poção de cura e uma de veneno podem mudar a noite.', seer: 'Descubra o lado verdadeiro de um jogador a cada noite.', hunter: 'Se você cair, ainda pode dar um último tiro.', amor: 'Una dois destinos durante a primeira noite.', fool: 'O voto revela você, mas só tira seu direito de votar.', girl: 'Observe a alcateia em segredo e arrisque ser descoberta.', priest: 'Uma bênção protege contra a alcateia uma única vez.' },
    },
    scoreBoard: { title: 'Placar da vigília', ariaLabel: 'Placar da vigília noturna', place: 'Posição {{place}}', points: 'Pontuação: {{count}}' },
    vote: { mayorElection: 'Eleição do prefeito', tiebreaker: 'Empate — o prefeito decide', vote: 'Votação', cast: 'Votos: {{cast}} / {{total}}', noVote: 'O bobo da vila não pode votar', mayor: 'Prefeito', yourVote: 'Seu voto', waiting: 'Esperando todos os votos…' },
    error: { eyebrow: 'Conexão interrompida', title: 'A partida perdeu o ritmo', description: 'Recarregue a rodada. Sua partida local continuará segura.', retry: 'Tentar novamente', home: 'Menu principal' },
  },
} satisfies TranslationShape<typeof en>

const zh = {
  components: {
    admin: {
      settings: '设置', saving: '正在保存', votesLabel: '公开显示投票', votesDescription: '所有人都能看到投票对象。', mayorLabel: '选举村长',
      mayorDescription: '负责打破平票并传递头衔。', autoLabel: '自动分配角色', autoDescription: '根据玩家人数调整配置。', roles: '角色配置',
      decreaseRole: '减少{{role}}', increaseRole: '增加{{role}}', minimumPlayers: '至少需要5名玩家', minimumWolf: '至少添加一名狼人', wolfBalance: '狼人必须保持少数',
      ready: '角色配置已就绪', excessRoles: '多出{{count}}个角色', missingRoles: '还缺{{count}}个角色', preparing: '正在准备游戏', start: '开始游戏',
    },
    gameLog: { title: '事件', ariaLabel: '游戏事件' },
    miniGame: { title: '守夜', points: '得分：{{count}}', paused: '已暂停——轮到你行动', board: '守夜棋盘', tileActionGain: '点击{{label}}，得分 +{{count}}', tileActionLose: '点击{{label}}，得分 −{{count}}', tiles: { coin: '金币', bomb: '陷阱', star: '星星' } },
    night: {
      sleepingTitle: '村庄正在沉睡', sleepingDescription: '等待你的角色被唤醒。', actionSent: '行动已发送。', waitingOthers: '正在等待其他角色。',
      amor: { title: '连接两颗心', description: '选择两名不同的玩家，他们的关系会被保密。', confirm: '确认情侣' },
      priest: { used: '本局已经使用过祝福。', title: '今晚的守护', description: '祝福可以挡住狼群的一次攻击。', confirm: '赐予祝福' },
      wolf: { title: '狼群选择目标', description: '共同选出一名受害者。狼人不能互相攻击。', voteLabel: '狼群投票', voted: '已投票', waiting: '仍在选择', target: '目标：{{name}}', confirm: '确认目标' },
      girl: { title: '悄悄看一眼', description: '今晚你可以观察狼群一次。', warning: '狼群可能会注意到你的动静。', peek: '小心查看', resultTitle: '你认出了狼群', keepSecret: '把这个秘密留到白天。', alreadyPeeked: '你今晚已经查看过了。' },
      witch: { poisonTitle: '毒药', poisonDescription: '选择今晚要被毒药击中的玩家。', back: '返回', poison: '下毒', title: '女巫苏醒', description: '今晚可以使用两瓶药，也可以结束行动。', packTarget: '狼群目标', noAttack: '无人受到攻击', healUsed: '解药已使用', healSpent: '解药已耗尽', healTarget: '救治{{name}}', choosePoison: '选择下毒目标', poisonUsed: '毒药已使用', poisonSpent: '毒药已耗尽', finish: '结束夜间行动' },
      seer: { visionTitle: '你的预言', visionDescription: '只有你能看到这个结果。', wolf: '属于狼群', safe: '不是狼人', title: '看穿伪装', description: '你想查看谁的真实身份？', reveal: '查看角色' },
    },
    playerList: { dead: '已死亡', you: '你', mayor: '村长', noVote: '无投票权', selected: '已选择' },
    roleCard: {
      revealLabel: '揭晓秘密角色', private: '仅供你查看', secretRole: '你的秘密角色', tapToReveal: '点击揭晓', youAre: '你是', mayor: '村长', player: '玩家',
      descriptions: { villager: '找出狼人，并在太迟之前说服村庄。', werewolf: '夜晚选择受害者，白天隐藏身份。', witch: '一瓶解药和一瓶毒药可以改变整夜局势。', seer: '每晚查看一名玩家的真实阵营。', hunter: '倒下时，你还可以开出最后一枪。', amor: '在第一个夜晚连接两个人的命运。', fool: '投票会揭露你，但只会让你失去投票权。', girl: '暗中观察狼群，但也可能被发现。', priest: '一次祝福可以抵挡狼群攻击。' },
    },
    scoreBoard: { title: '守夜排行榜', ariaLabel: '守夜排行榜', place: '第{{place}}名', points: '得分：{{count}}' },
    vote: { mayorElection: '村长选举', tiebreaker: '平票——由村长决定', vote: '投票', cast: '已投：{{cast}} / {{total}}', noVote: '村庄傻瓜没有投票权', mayor: '村长', yourVote: '你的选择', waiting: '正在等待所有人投票…' },
    error: { eyebrow: '连接已中断', title: '游戏暂时失去节奏', description: '请重新加载本轮，本地进度会保留。', retry: '重试', home: '主菜单' },
  },
} satisfies TranslationShape<typeof en>

const ja = {
  components: {
    admin: {
      settings: '設定', saving: '保存中', votesLabel: '投票先を公開', votesDescription: '誰が誰に投票したか全員に表示します。', mayorLabel: '村長を選ぶ',
      mayorDescription: '同票を決め、役職を引き継ぎます。', autoLabel: '役職を自動で割り当てる', autoDescription: '人数に合わせて構成を調整します。', roles: '役職構成',
      decreaseRole: '{{role}}を減らす', increaseRole: '{{role}}を増やす', minimumPlayers: '5人以上必要です', minimumWolf: '人狼を1人以上追加してください', wolfBalance: '人狼は少数である必要があります',
      ready: '役職構成の準備ができました', excessRoles: '役職が{{count}}人多すぎます', missingRoles: '役職が{{count}}人足りません', preparing: 'ゲームを準備中', start: 'ゲーム開始',
    },
    gameLog: { title: 'イベント', ariaLabel: 'ゲームイベント' },
    miniGame: { title: '夜の見張り', points: 'スコア：{{count}}', paused: '一時停止中 — あなたの番です', board: '夜の見張りボード', tileActionGain: '{{label}}をタップ、スコア +{{count}}', tileActionLose: '{{label}}をタップ、スコア −{{count}}', tiles: { coin: 'コイン', bomb: '罠', star: 'スター' } },
    night: {
      sleepingTitle: '村は眠っています', sleepingDescription: '自分の役職が呼ばれるまで待ってください。', actionSent: 'アクションを送信しました。', waitingOthers: '他の役職を待っています。',
      amor: { title: '二つの心を結ぶ', description: '異なる2人を選んでください。関係は秘密です。', confirm: '恋人を決定' },
      priest: { used: 'このゲームでは祝福をすでに使いました。', title: '今夜の守り', description: '祝福は群れの攻撃を一度防ぎます。', confirm: '祝福する' },
      wolf: { title: '群れが選ぶ', description: '犠牲者を決めてください。人狼同士は選べません。', voteLabel: '群れの投票', voted: '投票済み', waiting: '選択中', target: '対象：{{name}}', confirm: '対象を決定' },
      girl: { title: '少しだけのぞく', description: '今夜一度だけ群れを観察できます。', warning: '群れに動きを気づかれるかもしれません。', peek: '慎重に見る', resultTitle: '群れを見つけました', keepSecret: 'この情報は次の昼まで秘密にしてください。', alreadyPeeked: '今夜はすでに見ました。' },
      witch: { poisonTitle: '毒薬', poisonDescription: '今夜、毒薬を使う相手を選んでください。', back: '戻る', poison: '毒を使う', title: '魔女が目覚める', description: '両方の薬を使うか、行動を終えてください。', packTarget: '群れの対象', noAttack: '誰も襲われていません', healUsed: '回復薬を使用済み', healSpent: '回復薬はありません', healTarget: '{{name}}を治す', choosePoison: '毒薬の対象を選ぶ', poisonUsed: '毒薬を使用済み', poisonSpent: '毒薬はありません', finish: '夜の行動を終える' },
      seer: { visionTitle: 'あなたの予言', visionDescription: 'この結果はあなただけに見えます。', wolf: '群れの一員', safe: '人狼ではない', title: '仮面の裏を見る', description: '誰の本当の役職を知りたいですか？', reveal: '役職を見る' },
    },
    playerList: { dead: '死亡', you: 'あなた', mayor: '村長', noVote: '投票不可', selected: '選択済み' },
    roleCard: {
      revealLabel: '秘密の役職を表示', private: 'あなただけに表示', secretRole: 'あなたの秘密の役職', tapToReveal: 'タップして表示', youAre: 'あなたは', mayor: '村長', player: 'プレイヤー',
      descriptions: { villager: '手遅れになる前に人狼を見つけ、村を説得してください。', werewolf: '夜に犠牲者を選び、昼は正体を隠してください。', witch: '回復薬と毒薬の一つずつが夜を変えます。', seer: '毎晩、1人の本当の陣営を見抜きます。', hunter: '倒れたとき、最後の一発を撃てます。', amor: '最初の夜に2人の運命を結びます。', fool: '投票で正体が出ますが、失うのは投票権だけです。', girl: '群れを密かに観察し、見つかる危険を負います。', priest: '一度だけの祝福で群れの攻撃を防ぎます。' },
    },
    scoreBoard: { title: '夜の見張りランキング', ariaLabel: '夜の見張りランキング', place: '{{place}}位', points: 'スコア：{{count}}' },
    vote: { mayorElection: '村長選挙', tiebreaker: '同票 — 村長が決定', vote: '投票', cast: '投票済み：{{cast}} / {{total}}', noVote: '村の愚か者には投票権がありません', mayor: '村長', yourVote: 'あなたの投票', waiting: '全員の投票を待っています…' },
    error: { eyebrow: '接続が切れました', title: 'ゲームが一時停止しました', description: 'ラウンドを再読み込みしてください。端末の進行状況は残ります。', retry: 'もう一度試す', home: 'メインメニュー' },
  },
} satisfies TranslationShape<typeof en>

const ko = {
  components: {
    admin: {
      settings: '설정', saving: '저장 중', votesLabel: '투표 공개', votesDescription: '누가 누구에게 투표했는지 모두에게 보여요.', mayorLabel: '시장 선출',
      mayorDescription: '동률을 결정하고 직책을 넘겨요.', autoLabel: '역할 자동 배정', autoDescription: '인원수에 맞춰 구성을 조정해요.', roles: '역할 구성',
      decreaseRole: '{{role}} 줄이기', increaseRole: '{{role}} 늘리기', minimumPlayers: '최소 5명이 필요해요', minimumWolf: '늑대인간을 최소 1명 추가하세요', wolfBalance: '늑대인간은 소수여야 해요',
      ready: '역할 구성이 준비됐어요', excessRoles: '역할이 {{count}}개 많아요', missingRoles: '역할이 {{count}}개 부족해요', preparing: '게임 준비 중', start: '게임 시작',
    },
    gameLog: { title: '이벤트', ariaLabel: '게임 이벤트' },
    miniGame: { title: '야간 경비', points: '점수: {{count}}', paused: '일시 정지 — 지금은 내 차례예요', board: '야간 경비 보드', tileActionGain: '{{label}} 누르기, 점수 +{{count}}', tileActionLose: '{{label}} 누르기, 점수 −{{count}}', tiles: { coin: '동전', bomb: '함정', star: '별' } },
    night: {
      sleepingTitle: '마을이 잠들었어요', sleepingDescription: '내 역할이 불릴 때까지 기다리세요.', actionSent: '행동을 보냈어요.', waitingOthers: '다른 역할을 기다리고 있어요.',
      amor: { title: '두 마음 잇기', description: '서로 다른 두 명을 고르세요. 관계는 비밀이에요.', confirm: '연인 확인' },
      priest: { used: '이번 게임에서 축복을 이미 사용했어요.', title: '오늘 밤의 보호', description: '축복은 무리의 공격을 한 번 막아요.', confirm: '축복하기' },
      wolf: { title: '무리가 선택해요', description: '희생자를 정하세요. 늑대인간끼리는 선택할 수 없어요.', voteLabel: '무리 투표', voted: '투표함', waiting: '선택 중', target: '대상: {{name}}', confirm: '대상 확인' },
      girl: { title: '잠깐 엿보기', description: '오늘 밤 무리를 한 번 지켜볼 수 있어요.', warning: '무리가 움직임을 알아챌 수 있어요.', peek: '조심히 보기', resultTitle: '무리를 알아냈어요', keepSecret: '이 정보는 다음 낮까지 비밀로 하세요.', alreadyPeeked: '오늘 밤 이미 확인했어요.' },
      witch: { poisonTitle: '독약', poisonDescription: '오늘 밤 독약을 쓸 대상을 고르세요.', back: '뒤로', poison: '독 쓰기', title: '마녀가 깨어나요', description: '두 물약을 모두 쓰거나 차례를 끝내세요.', packTarget: '무리의 대상', noAttack: '아무도 공격받지 않았어요', healUsed: '회복약 사용함', healSpent: '회복약 없음', healTarget: '{{name}} 치료', choosePoison: '독약 대상 고르기', poisonUsed: '독약 사용함', poisonSpent: '독약 없음', finish: '밤 차례 끝내기' },
      seer: { visionTitle: '당신의 예지', visionDescription: '이 결과는 나만 볼 수 있어요.', wolf: '무리의 일원', safe: '늑대인간이 아님', title: '가면 뒤 보기', description: '누구의 진짜 역할을 알아볼까요?', reveal: '역할 확인' },
    },
    playerList: { dead: '사망', you: '나', mayor: '시장', noVote: '투표권 없음', selected: '선택됨' },
    roleCard: {
      revealLabel: '비밀 역할 공개', private: '나만 볼 수 있어요', secretRole: '나의 비밀 역할', tapToReveal: '눌러서 공개', youAre: '당신의 역할', mayor: '시장', player: '플레이어',
      descriptions: { villager: '늦기 전에 늑대인간을 찾아 마을을 설득하세요.', werewolf: '밤에 희생자를 고르고 낮에는 정체를 숨기세요.', witch: '회복약 하나와 독약 하나가 밤을 바꿀 수 있어요.', seer: '매일 밤 한 명의 진짜 편을 알아내세요.', hunter: '쓰러지면 마지막 한 발을 쏠 수 있어요.', amor: '첫날밤 두 사람의 운명을 이어 주세요.', fool: '투표로 정체가 드러나지만 투표권만 잃어요.', girl: '무리를 몰래 보고 들킬 위험을 감수해요.', priest: '한 번의 축복으로 무리의 공격을 막아요.' },
    },
    scoreBoard: { title: '야간 경비 순위', ariaLabel: '야간 경비 순위', place: '{{place}}위', points: '점수: {{count}}' },
    vote: { mayorElection: '시장 선거', tiebreaker: '동률 — 시장이 결정', vote: '투표', cast: '투표: {{cast}} / {{total}}', noVote: '마을 바보는 투표할 수 없어요', mayor: '시장', yourVote: '내 투표', waiting: '모든 투표를 기다리는 중…' },
    error: { eyebrow: '연결이 끊겼어요', title: '게임이 잠시 멈췄어요', description: '라운드를 다시 불러오세요. 기기의 진행 상황은 유지돼요.', retry: '다시 시도', home: '메인 메뉴' },
  },
} satisfies TranslationShape<typeof en>

const ar = {
  components: {
    admin: {
      settings: 'الإعدادات', saving: 'جارٍ الحفظ', votesLabel: 'إظهار الأصوات', votesDescription: 'يرى الجميع من صوّت لمن.', mayorLabel: 'انتخاب العمدة',
      mayorDescription: 'يحسم التعادل ويمرر اللقب.', autoLabel: 'توزيع الأدوار تلقائيًا', autoDescription: 'يضبط التشكيلة حسب حجم المجموعة.', roles: 'إعداد الأدوار',
      decreaseRole: 'تقليل {{role}}', increaseRole: 'إضافة {{role}}', minimumPlayers: 'تحتاج اللعبة إلى 5 لاعبين على الأقل', minimumWolf: 'أضف مستذئبًا واحدًا على الأقل', wolfBalance: 'يجب أن يبقى المستذئبون أقلية',
      ready: 'توزيع الأدوار جاهز', excessRoles: 'زيادة الأدوار: {{count}}', missingRoles: 'الأدوار الناقصة: {{count}}', preparing: 'جارٍ تجهيز اللعبة', start: 'ابدأ اللعبة',
    },
    gameLog: { title: 'الأحداث', ariaLabel: 'أحداث اللعبة' },
    miniGame: { title: 'حراسة الليل', points: 'النتيجة: {{count}}', paused: 'متوقفة — حان دورك', board: 'لوحة حراسة الليل', tileActionGain: 'المس {{label}}، النتيجة +{{count}}', tileActionLose: 'المس {{label}}، النتيجة −{{count}}', tiles: { coin: 'عملة', bomb: 'فخ', star: 'نجمة' } },
    night: {
      sleepingTitle: 'القرية نائمة', sleepingDescription: 'انتظر حتى يحين دور شخصيتك.', actionSent: 'تم إرسال الحركة.', waitingOthers: 'بانتظار الأدوار الأخرى.',
      amor: { title: 'اربط قلبين', description: 'اختر لاعبين مختلفين. ستبقى علاقتهما سرية.', confirm: 'تأكيد العاشقين' },
      priest: { used: 'استُخدمت البركة بالفعل في هذه اللعبة.', title: 'حماية لهذه الليلة', description: 'تصد البركة هجومًا واحدًا من القطيع.', confirm: 'منح البركة' },
      wolf: { title: 'القطيع يختار', description: 'اتفقوا على ضحية. لا يمكن للمستذئبين اختيار بعضهم.', voteLabel: 'تصويت القطيع', voted: 'صوّت', waiting: 'ما زال يختار', target: 'الهدف: {{name}}', confirm: 'تأكيد الهدف' },
      girl: { title: 'نظرة سريعة', description: 'يمكنك مراقبة القطيع مرة واحدة الليلة.', warning: 'قد يلاحظ القطيع حركتك.', peek: 'انظر بحذر', resultTitle: 'تعرفت على القطيع', keepSecret: 'احتفظ بهذه المعلومة لليوم القادم.', alreadyPeeked: 'لقد نظرت بالفعل هذه الليلة.' },
      witch: { poisonTitle: 'جرعة السم', poisonDescription: 'اختر من ستصيبه الجرعة هذه الليلة.', back: 'رجوع', poison: 'تسميم', title: 'تستيقظ الساحرة', description: 'استخدم الجرعتين أو أنهِ دورك.', packTarget: 'هدف القطيع', noAttack: 'لم يتعرض أحد للهجوم', healUsed: 'استُخدمت جرعة الشفاء', healSpent: 'نفدت جرعة الشفاء', healTarget: 'شفاء {{name}}', choosePoison: 'اختر هدف السم', poisonUsed: 'استُخدمت جرعة السم', poisonSpent: 'نفدت جرعة السم', finish: 'إنهاء دور الليل' },
      seer: { visionTitle: 'رؤيتك', visionDescription: 'أنت وحدك ترى هذه النتيجة.', wolf: 'من أفراد القطيع', safe: 'ليس مستذئبًا', title: 'انظر خلف القناع', description: 'دور من الحقيقي الذي تريد كشفه؟', reveal: 'كشف الدور' },
    },
    playerList: { dead: 'ميت', you: 'أنت', mayor: 'العمدة', noVote: 'لا يحق له التصويت', selected: 'محدد' },
    roleCard: {
      revealLabel: 'كشف الدور السري', private: 'لعينيك فقط', secretRole: 'دورك السري', tapToReveal: 'المس للكشف', youAre: 'أنت', mayor: 'العمدة', player: 'اللاعب',
      descriptions: { villager: 'اعثر على المستذئبين وأقنع القرية قبل فوات الأوان.', werewolf: 'اختر ضحية ليلًا وحافظ على سرك نهارًا.', witch: 'جرعة شفاء وأخرى سامة يمكنهما تغيير الليل.', seer: 'اكتشف حقيقة لاعب واحد كل ليلة.', hunter: 'إذا سقطت، يمكنك إطلاق رصاصة أخيرة.', amor: 'اربط مصير شخصين في الليلة الأولى.', fool: 'يكشفك التصويت لكنه يسلبك حق التصويت فقط.', girl: 'راقب القطيع سرًا مع خطر اكتشافك.', priest: 'بركة واحدة تحمي من هجوم القطيع.' },
    },
    scoreBoard: { title: 'ترتيب حراسة الليل', ariaLabel: 'ترتيب حراسة الليل', place: 'المركز {{place}}', points: 'النتيجة: {{count}}' },
    vote: { mayorElection: 'انتخاب العمدة', tiebreaker: 'تعادل — العمدة يقرر', vote: 'تصويت', cast: 'الأصوات: {{cast}} / {{total}}', noVote: 'لا يحق لأحمق القرية التصويت', mayor: 'العمدة', yourVote: 'صوتك', waiting: 'بانتظار جميع الأصوات…' },
    error: { eyebrow: 'انقطع الاتصال', title: 'توقفت اللعبة للحظة', description: 'أعد تحميل الجولة. ستبقى بيانات لعبتك المحلية محفوظة.', retry: 'حاول مجددًا', home: 'القائمة الرئيسية' },
  },
} satisfies TranslationShape<typeof en>

export const COMPONENT_TRANSLATIONS = { en, de, es, fr, it, pt, zh, ja, ko, ar } as const
