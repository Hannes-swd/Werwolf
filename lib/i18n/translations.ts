import { GAME_TRANSLATIONS } from './gameTranslations'
import { COMPONENT_TRANSLATIONS } from './componentTranslations'

export const SUPPORTED_LOCALES = ['en', 'de', 'es', 'fr', 'it', 'pt', 'zh', 'ja', 'ko', 'ar'] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]
export type TextDirection = 'ltr' | 'rtl'

export const DEFAULT_LOCALE: Locale = 'en'
export const LOCALE_STORAGE_KEY = 'werwolf_locale'

export const HTML_LANG: Record<Locale, string> = {
  en: 'en',
  de: 'de-DE',
  es: 'es',
  fr: 'fr',
  it: 'it-IT',
  pt: 'pt',
  zh: 'zh-CN',
  ja: 'ja',
  ko: 'ko',
  ar: 'ar',
}

export const LOCALE_DIRECTION: Record<Locale, TextDirection> = {
  en: 'ltr',
  de: 'ltr',
  es: 'ltr',
  fr: 'ltr',
  it: 'ltr',
  pt: 'ltr',
  zh: 'ltr',
  ja: 'ltr',
  ko: 'ltr',
  ar: 'rtl',
}

export const LOCALE_NATIVE_NAMES: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  pt: 'Português',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  ar: 'العربية',
}

export const SHORT_LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  de: 'DE',
  es: 'ES',
  fr: 'FR',
  it: 'IT',
  pt: 'PT',
  zh: '中',
  ja: '日',
  ko: '한',
  ar: 'ع',
}

const enBase = {
  common: {
    appName: 'Werewolf',
  },
  metadata: {
    title: 'Werewolf',
    description: 'The classic social game for your group, right in the browser.',
  },
  language: {
    label: 'Language',
    groupLabel: 'Choose language',
    changeTo: 'Choose {{language}}',
  },
  theme: {
    label: 'Appearance',
    switchToLight: 'Switch to light appearance',
    switchToDark: 'Switch to dark appearance',
    dark: 'Dark',
    light: 'Light',
  },
  home: {
    guestName: 'Player',
    kicker: 'One night. One village. Plenty of lies.',
    title: 'Werewolf',
    subtitle: 'The village wakes up. Find the wolves before they find you.',
    panelLabel: 'Start playing',
    nameLabel: 'Your name',
    namePlaceholder: 'Enter your name',
    nameHint: 'This is how the others will see you.',
    create: 'Create lobby',
    creating: 'Creating lobby',
    divider: 'or join',
    codeLabel: 'Lobby code',
    codeInputLabel: 'Six-character lobby code',
    join: 'Join',
    searching: 'Searching',
    privacyNote: 'No account needed · play right away',
    errors: {
      kicked: 'You were removed from the lobby.',
      closed: 'The lobby was closed.',
      notFound: 'No lobby found with this code.',
      invalidCode: 'Enter a valid six-character lobby code.',
    },
  },
  lobby: {
    loading: 'Loading lobby',
    open: 'Lobby is open',
    codeLabel: 'Lobby code',
    copyCodeLabel: 'Copy lobby code {{code}}',
    linkCopied: 'Link copied',
    shareInvite: 'Share invite',
    playersTitle: 'Players',
    you: 'You',
    hostLabel: 'Host',
    kickPlayerLabel: 'Remove {{name}} from the lobby',
    close: 'Close lobby',
    confirmClose: 'Close this lobby? Everyone will return to the main menu.',
    preparingTitle: 'Getting the game ready',
    preparingDescription: 'The host is choosing roles and rules.',
    validation: {
      roles: 'Check the role setup before starting the game.',
    },
    notices: {
      codeCopied: 'Lobby code copied.',
      copyFailed: 'Could not copy the code. Please select it manually.',
      invitationShared: 'Invite shared.',
      inviteLinkCopied: 'Invite link copied.',
      shareFailed: 'Could not share the invite.',
      syncFailed: 'The room could not be synced. Check your connection and try again.',
    },
    inviteText: 'Join my lobby. Code: {{code}}',
  },
} as const

type TranslationShape<T> = {
  [Key in keyof T]: T[Key] extends string ? string : TranslationShape<T[Key]>
}

const deBase = {
  common: {
    appName: 'Werwolf',
  },
  metadata: {
    title: 'Werwolf',
    description: 'Das klassische Gesellschaftsspiel für eure Runde – direkt im Browser.',
  },
  language: {
    label: 'Sprache',
    groupLabel: 'Sprache wählen',
    changeTo: '{{language}} wählen',
  },
  theme: {
    label: 'Darstellung',
    switchToLight: 'Zur hellen Darstellung wechseln',
    switchToDark: 'Zur dunklen Darstellung wechseln',
    dark: 'Dunkel',
    light: 'Hell',
  },
  home: {
    guestName: 'Spieler',
    kicker: 'Eine Nacht. Ein Dorf. Viele Lügen.',
    title: 'Werwolf',
    subtitle: 'Das Dorf erwacht. Findet die Wölfe, bevor sie euch finden.',
    panelLabel: 'Spiel starten',
    nameLabel: 'Dein Spielname',
    namePlaceholder: 'Name eingeben',
    nameHint: 'So sehen dich die anderen in der Runde.',
    create: 'Lobby erstellen',
    creating: 'Lobby wird erstellt',
    divider: 'oder beitreten',
    codeLabel: 'Lobby-Code',
    codeInputLabel: 'Sechsstelliger Lobby-Code',
    join: 'Beitreten',
    searching: 'Suche',
    privacyNote: 'Keine Anmeldung nötig · direkt für eure Runde',
    errors: {
      kicked: 'Du wurdest aus der Lobby entfernt.',
      closed: 'Die Lobby wurde geschlossen.',
      notFound: 'Keine Lobby mit diesem Code gefunden.',
      invalidCode: 'Gib einen gültigen sechsstelligen Lobby-Code ein.',
    },
  },
  lobby: {
    loading: 'Lobby wird geladen',
    open: 'Lobby ist offen',
    codeLabel: 'Lobby-Code',
    copyCodeLabel: 'Lobby-Code {{code}} kopieren',
    linkCopied: 'Link kopiert',
    shareInvite: 'Einladung teilen',
    playersTitle: 'Spieler',
    you: 'Du',
    hostLabel: 'Spielleitung',
    kickPlayerLabel: '{{name}} aus der Lobby entfernen',
    close: 'Lobby schließen',
    confirmClose: 'Lobby wirklich schließen? Alle Spieler kehren zum Hauptmenü zurück.',
    preparingTitle: 'Die Runde wird vorbereitet',
    preparingDescription: 'Die Spielleitung stellt Rollen und Regeln ein.',
    validation: {
      roles: 'Prüfe die Rollenverteilung, bevor du das Spiel startest.',
    },
    notices: {
      codeCopied: 'Lobby-Code kopiert.',
      copyFailed: 'Der Code konnte nicht kopiert werden. Markiere ihn bitte manuell.',
      invitationShared: 'Einladung geteilt.',
      inviteLinkCopied: 'Einladungslink kopiert.',
      shareFailed: 'Die Einladung konnte nicht geteilt werden.',
      syncFailed: 'Die Lobby konnte nicht synchronisiert werden. Prüfe deine Verbindung und versuche es erneut.',
    },
    inviteText: 'Tritt meiner Lobby bei. Code: {{code}}',
  },
} satisfies TranslationShape<typeof enBase>

const esBase = {
  common: {
    appName: 'Hombres Lobo',
  },
  metadata: {
    title: 'Hombres Lobo',
    description: 'El clásico juego social para tu grupo, directamente en el navegador.',
  },
  language: {
    label: 'Idioma',
    groupLabel: 'Elegir idioma',
    changeTo: 'Elegir {{language}}',
  },
  theme: {
    label: 'Apariencia',
    switchToLight: 'Cambiar a apariencia clara',
    switchToDark: 'Cambiar a apariencia oscura',
    dark: 'Oscuro',
    light: 'Claro',
  },
  home: {
    guestName: 'Jugador',
    kicker: 'Una noche. Un pueblo. Muchas mentiras.',
    title: 'Hombres Lobo',
    subtitle: 'El pueblo despierta. Encuentra a los lobos antes de que te encuentren.',
    panelLabel: 'Empezar a jugar',
    nameLabel: 'Tu nombre',
    namePlaceholder: 'Escribe tu nombre',
    nameHint: 'Así te verán los demás.',
    create: 'Crear sala',
    creating: 'Creando sala',
    divider: 'o únete',
    codeLabel: 'Código de sala',
    codeInputLabel: 'Código de sala de seis caracteres',
    join: 'Entrar',
    searching: 'Buscando',
    privacyNote: 'Sin cuenta · juega ahora con tu grupo',
    errors: {
      kicked: 'Te han quitado de la sala.',
      closed: 'La sala se ha cerrado.',
      notFound: 'No encontramos una sala con este código.',
      invalidCode: 'Escribe un código válido de seis caracteres.',
    },
  },
  lobby: {
    loading: 'Cargando sala',
    open: 'La sala está abierta',
    codeLabel: 'Código de sala',
    copyCodeLabel: 'Copiar el código {{code}}',
    linkCopied: 'Enlace copiado',
    shareInvite: 'Compartir invitación',
    playersTitle: 'Jugadores',
    you: 'Tú',
    hostLabel: 'Anfitrión',
    kickPlayerLabel: 'Quitar a {{name}} de la sala',
    close: 'Cerrar sala',
    confirmClose: '¿Cerrar esta sala? Todos volverán al menú principal.',
    preparingTitle: 'Preparando la partida',
    preparingDescription: 'El anfitrión está eligiendo los roles y las reglas.',
    validation: {
      roles: 'Revisa los roles antes de empezar.',
    },
    notices: {
      codeCopied: 'Código de sala copiado.',
      copyFailed: 'No se pudo copiar el código. Selecciónalo manualmente.',
      invitationShared: 'Invitación compartida.',
      inviteLinkCopied: 'Enlace de invitación copiado.',
      shareFailed: 'No se pudo compartir la invitación.',
      syncFailed: 'No se pudo sincronizar la sala. Revisa la conexión e inténtalo de nuevo.',
    },
    inviteText: 'Únete a mi sala. Código: {{code}}',
  },
} satisfies TranslationShape<typeof enBase>

const frBase = {
  common: {
    appName: 'Loup-Garou',
  },
  metadata: {
    title: 'Loup-Garou',
    description: 'Le grand classique des jeux de groupe, directement dans le navigateur.',
  },
  language: {
    label: 'Langue',
    groupLabel: 'Choisir la langue',
    changeTo: 'Choisir {{language}}',
  },
  theme: {
    label: 'Apparence',
    switchToLight: 'Passer à l\'apparence claire',
    switchToDark: 'Passer à l\'apparence sombre',
    dark: 'Sombre',
    light: 'Clair',
  },
  home: {
    guestName: 'Joueur',
    kicker: 'Une nuit. Un village. Beaucoup de mensonges.',
    title: 'Loup-Garou',
    subtitle: "Le village se réveille. Trouvez les loups avant qu'ils ne vous trouvent.",
    panelLabel: 'Commencer à jouer',
    nameLabel: 'Ton nom',
    namePlaceholder: 'Entre ton nom',
    nameHint: 'Les autres te verront sous ce nom.',
    create: 'Créer un salon',
    creating: 'Création du salon',
    divider: 'ou rejoindre',
    codeLabel: 'Code du salon',
    codeInputLabel: 'Code du salon à six caractères',
    join: 'Rejoindre',
    searching: 'Recherche',
    privacyNote: 'Pas de compte · joue tout de suite',
    errors: {
      kicked: 'Tu as été retiré du salon.',
      closed: 'Le salon a été fermé.',
      notFound: 'Aucun salon trouvé avec ce code.',
      invalidCode: 'Entre un code valide de six caractères.',
    },
  },
  lobby: {
    loading: 'Chargement du salon',
    open: 'Le salon est ouvert',
    codeLabel: 'Code du salon',
    copyCodeLabel: 'Copier le code {{code}}',
    linkCopied: 'Lien copié',
    shareInvite: "Partager l'invitation",
    playersTitle: 'Joueurs',
    you: 'Toi',
    hostLabel: 'Hôte',
    kickPlayerLabel: 'Retirer {{name}} du salon',
    close: 'Fermer le salon',
    confirmClose: 'Fermer ce salon ? Tout le monde retournera au menu principal.',
    preparingTitle: 'Préparation de la partie',
    preparingDescription: "L'hôte choisit les rôles et les règles.",
    validation: {
      roles: 'Vérifie les rôles avant de commencer.',
    },
    notices: {
      codeCopied: 'Code du salon copié.',
      copyFailed: 'Impossible de copier le code. Sélectionne-le manuellement.',
      invitationShared: 'Invitation partagée.',
      inviteLinkCopied: "Lien d'invitation copié.",
      shareFailed: "Impossible de partager l'invitation.",
      syncFailed: 'Impossible de synchroniser le salon. Vérifie ta connexion et réessaie.',
    },
    inviteText: 'Rejoins mon salon. Code : {{code}}',
  },
} satisfies TranslationShape<typeof enBase>

const itBase = {
  common: {
    appName: 'Lupo Mannaro',
  },
  metadata: {
    title: 'Lupo Mannaro',
    description: 'Il classico gioco di gruppo, direttamente nel browser.',
  },
  language: {
    label: 'Lingua',
    groupLabel: 'Scegli la lingua',
    changeTo: 'Scegli {{language}}',
  },
  theme: {
    label: 'Aspetto',
    switchToLight: 'Passa all\'aspetto chiaro',
    switchToDark: 'Passa all\'aspetto scuro',
    dark: 'Scuro',
    light: 'Chiaro',
  },
  home: {
    guestName: 'Giocatore',
    kicker: 'Una notte. Un villaggio. Tante bugie.',
    title: 'Lupo Mannaro',
    subtitle: 'Il villaggio si sveglia. Trovate i lupi prima che trovino voi.',
    panelLabel: 'Inizia a giocare',
    nameLabel: 'Il tuo nome',
    namePlaceholder: 'Scrivi il tuo nome',
    nameHint: 'Gli altri ti vedranno così.',
    create: 'Crea lobby',
    creating: 'Creo la lobby',
    divider: 'oppure entra',
    codeLabel: 'Codice lobby',
    codeInputLabel: 'Codice lobby di sei caratteri',
    join: 'Entra',
    searching: 'Cerco',
    privacyNote: 'Nessun account · gioca subito con il tuo gruppo',
    errors: {
      kicked: 'Sei stato rimosso dalla lobby.',
      closed: 'La lobby è stata chiusa.',
      notFound: 'Non trovo una lobby con questo codice.',
      invalidCode: 'Inserisci un codice valido di sei caratteri.',
    },
  },
  lobby: {
    loading: 'Carico la lobby',
    open: 'La lobby è aperta',
    codeLabel: 'Codice lobby',
    copyCodeLabel: 'Copia il codice lobby {{code}}',
    linkCopied: 'Link copiato',
    shareInvite: 'Condividi invito',
    playersTitle: 'Giocatori',
    you: 'Tu',
    hostLabel: 'Host',
    kickPlayerLabel: 'Rimuovi {{name}} dalla lobby',
    close: 'Chiudi lobby',
    confirmClose: 'Vuoi chiudere la lobby? Tutti tornano al menu principale.',
    preparingTitle: 'Preparo la partita',
    preparingDescription: "L'host sta scegliendo ruoli e regole.",
    validation: {
      roles: 'Controlla i ruoli prima di iniziare.',
    },
    notices: {
      codeCopied: 'Codice lobby copiato.',
      copyFailed: 'Non posso copiare il codice. Selezionalo a mano.',
      invitationShared: 'Invito condiviso.',
      inviteLinkCopied: 'Link di invito copiato.',
      shareFailed: "Non posso condividere l'invito.",
      syncFailed: 'Non posso sincronizzare la lobby. Controlla la connessione e riprova.',
    },
    inviteText: 'Entra nella mia lobby. Codice: {{code}}',
  },
} satisfies TranslationShape<typeof enBase>

const ptBase = {
  common: {
    appName: 'Lobisomem',
  },
  metadata: {
    title: 'Lobisomem',
    description: 'O clássico jogo de grupo, direto no navegador.',
  },
  language: {
    label: 'Idioma',
    groupLabel: 'Escolher idioma',
    changeTo: 'Escolher {{language}}',
  },
  theme: {
    label: 'Aparência',
    switchToLight: 'Mudar para aparência clara',
    switchToDark: 'Mudar para aparência escura',
    dark: 'Escuro',
    light: 'Claro',
  },
  home: {
    guestName: 'Jogador',
    kicker: 'Uma noite. Uma vila. Muitas mentiras.',
    title: 'Lobisomem',
    subtitle: 'A vila acorda. Encontrem os lobos antes que eles encontrem vocês.',
    panelLabel: 'Começar a jogar',
    nameLabel: 'Seu nome',
    namePlaceholder: 'Digite seu nome',
    nameHint: 'É assim que os outros verão você.',
    create: 'Criar sala',
    creating: 'Criando sala',
    divider: 'ou entrar',
    codeLabel: 'Código da sala',
    codeInputLabel: 'Código da sala com seis caracteres',
    join: 'Entrar',
    searching: 'Procurando',
    privacyNote: 'Sem conta · jogue agora com seu grupo',
    errors: {
      kicked: 'Você foi removido da sala.',
      closed: 'A sala foi fechada.',
      notFound: 'Nenhuma sala encontrada com este código.',
      invalidCode: 'Digite um código válido de seis caracteres.',
    },
  },
  lobby: {
    loading: 'Carregando sala',
    open: 'A sala está aberta',
    codeLabel: 'Código da sala',
    copyCodeLabel: 'Copiar código {{code}}',
    linkCopied: 'Link copiado',
    shareInvite: 'Compartilhar convite',
    playersTitle: 'Jogadores',
    you: 'Você',
    hostLabel: 'Anfitrião',
    kickPlayerLabel: 'Remover {{name}} da sala',
    close: 'Fechar sala',
    confirmClose: 'Fechar esta sala? Todos voltarão ao menu principal.',
    preparingTitle: 'Preparando o jogo',
    preparingDescription: 'O anfitrião está escolhendo os papéis e as regras.',
    validation: {
      roles: 'Confira os papéis antes de começar.',
    },
    notices: {
      codeCopied: 'Código da sala copiado.',
      copyFailed: 'Não foi possível copiar o código. Selecione-o manualmente.',
      invitationShared: 'Convite compartilhado.',
      inviteLinkCopied: 'Link do convite copiado.',
      shareFailed: 'Não foi possível compartilhar o convite.',
      syncFailed: 'Não foi possível sincronizar a sala. Verifique a ligação e tente novamente.',
    },
    inviteText: 'Entre na minha sala. Código: {{code}}',
  },
} satisfies TranslationShape<typeof enBase>

const zhBase = {
  common: {
    appName: '狼人',
  },
  metadata: {
    title: '狼人',
    description: '经典多人推理游戏，打开浏览器就能玩。',
  },
  language: {
    label: '语言',
    groupLabel: '选择语言',
    changeTo: '选择{{language}}',
  },
  theme: {
    label: '外观',
    switchToLight: '切换到浅色外观',
    switchToDark: '切换到深色外观',
    dark: '深色',
    light: '浅色',
  },
  home: {
    guestName: '玩家',
    kicker: '一夜。一村。谎言重重。',
    title: '狼人',
    subtitle: '村庄苏醒了。在狼人找到你们之前先找出他们。',
    panelLabel: '开始游戏',
    nameLabel: '你的名字',
    namePlaceholder: '输入名字',
    nameHint: '其他玩家会看到这个名字。',
    create: '创建房间',
    creating: '正在创建房间',
    divider: '或加入房间',
    codeLabel: '房间代码',
    codeInputLabel: '六位房间代码',
    join: '加入',
    searching: '查找中',
    privacyNote: '无需账号 · 直接和朋友一起玩',
    errors: {
      kicked: '你已被移出房间。',
      closed: '房间已关闭。',
      notFound: '找不到使用此代码的房间。',
      invalidCode: '请输入有效的六位房间代码。',
    },
  },
  lobby: {
    loading: '正在加载房间',
    open: '房间已开放',
    codeLabel: '房间代码',
    copyCodeLabel: '复制房间代码 {{code}}',
    linkCopied: '链接已复制',
    shareInvite: '分享邀请',
    playersTitle: '玩家',
    you: '你',
    hostLabel: '房主',
    kickPlayerLabel: '将{{name}}移出房间',
    close: '关闭房间',
    confirmClose: '要关闭房间吗？所有玩家都会返回主菜单。',
    preparingTitle: '正在准备游戏',
    preparingDescription: '房主正在选择角色和规则。',
    validation: {
      roles: '开始前请检查角色配置。',
    },
    notices: {
      codeCopied: '房间代码已复制。',
      copyFailed: '无法复制代码，请手动选择。',
      invitationShared: '邀请已分享。',
      inviteLinkCopied: '邀请链接已复制。',
      shareFailed: '无法分享邀请。',
      syncFailed: '无法同步房间。请检查网络后重试。',
    },
    inviteText: '加入我的房间。代码：{{code}}',
  },
} satisfies TranslationShape<typeof enBase>

const jaBase = {
  common: {
    appName: '人狼',
  },
  metadata: {
    title: '人狼',
    description: 'みんなで遊べる定番の人狼ゲーム。ブラウザですぐに始められます。',
  },
  language: {
    label: '言語',
    groupLabel: '言語を選ぶ',
    changeTo: '{{language}}を選ぶ',
  },
  theme: {
    label: '外観',
    switchToLight: 'ライト表示に切り替える',
    switchToDark: 'ダーク表示に切り替える',
    dark: 'ダーク',
    light: 'ライト',
  },
  home: {
    guestName: 'プレイヤー',
    kicker: '一夜。一つの村。たくさんの嘘。',
    title: '人狼',
    subtitle: '村が目を覚ます。人狼に見つかる前に見つけよう。',
    panelLabel: 'ゲームを始める',
    nameLabel: 'あなたの名前',
    namePlaceholder: '名前を入力',
    nameHint: '他のプレイヤーにはこの名前が表示されます。',
    create: 'ロビーを作る',
    creating: 'ロビーを作成中',
    divider: 'または参加',
    codeLabel: 'ロビーコード',
    codeInputLabel: '6文字のロビーコード',
    join: '参加',
    searching: '検索中',
    privacyNote: '登録不要 · すぐに遊べます',
    errors: {
      kicked: 'ロビーから退出させられました。',
      closed: 'ロビーが閉じられました。',
      notFound: 'このコードのロビーは見つかりません。',
      invalidCode: '有効な6文字のロビーコードを入力してください。',
    },
  },
  lobby: {
    loading: 'ロビーを読み込み中',
    open: 'ロビーは公開中',
    codeLabel: 'ロビーコード',
    copyCodeLabel: 'ロビーコード {{code}} をコピー',
    linkCopied: 'リンクをコピーしました',
    shareInvite: '招待を共有',
    playersTitle: 'プレイヤー',
    you: 'あなた',
    hostLabel: 'ホスト',
    kickPlayerLabel: '{{name}}をロビーから外す',
    close: 'ロビーを閉じる',
    confirmClose: 'ロビーを閉じますか？全員がメインメニューに戻ります。',
    preparingTitle: 'ゲームを準備中',
    preparingDescription: 'ホストが役職とルールを選んでいます。',
    validation: {
      roles: '開始前に役職の設定を確認してください。',
    },
    notices: {
      codeCopied: 'ロビーコードをコピーしました。',
      copyFailed: 'コードをコピーできません。手動で選択してください。',
      invitationShared: '招待を共有しました。',
      inviteLinkCopied: '招待リンクをコピーしました。',
      shareFailed: '招待を共有できません。',
      syncFailed: 'ロビーを同期できません。接続を確認してもう一度お試しください。',
    },
    inviteText: '私のロビーに参加してください。コード：{{code}}',
  },
} satisfies TranslationShape<typeof enBase>

const koBase = {
  common: {
    appName: '늑대인간',
  },
  metadata: {
    title: '늑대인간',
    description: '친구들과 즐기는 클래식 추리 게임. 브라우저에서 바로 시작하세요.',
  },
  language: {
    label: '언어',
    groupLabel: '언어 선택',
    changeTo: '{{language}} 선택',
  },
  theme: {
    label: '화면 모드',
    switchToLight: '밝은 모드로 전환',
    switchToDark: '어두운 모드로 전환',
    dark: '어두운 모드',
    light: '밝은 모드',
  },
  home: {
    guestName: '플레이어',
    kicker: '하룻밤. 한 마을. 수많은 거짓말.',
    title: '늑대인간',
    subtitle: '마을이 깨어납니다. 늑대가 여러분을 찾기 전에 먼저 찾아내세요.',
    panelLabel: '게임 시작',
    nameLabel: '내 이름',
    namePlaceholder: '이름 입력',
    nameHint: '다른 플레이어에게 이 이름이 보입니다.',
    create: '로비 만들기',
    creating: '로비 만드는 중',
    divider: '또는 참가',
    codeLabel: '로비 코드',
    codeInputLabel: '여섯 자리 로비 코드',
    join: '참가',
    searching: '찾는 중',
    privacyNote: '가입 필요 없음 · 바로 플레이하세요',
    errors: {
      kicked: '로비에서 내보내졌습니다.',
      closed: '로비가 닫혔습니다.',
      notFound: '이 코드의 로비를 찾을 수 없습니다.',
      invalidCode: '올바른 여섯 자리 로비 코드를 입력하세요.',
    },
  },
  lobby: {
    loading: '로비 불러오는 중',
    open: '로비가 열려 있습니다',
    codeLabel: '로비 코드',
    copyCodeLabel: '로비 코드 {{code}} 복사',
    linkCopied: '링크 복사됨',
    shareInvite: '초대 공유',
    playersTitle: '플레이어',
    you: '나',
    hostLabel: '호스트',
    kickPlayerLabel: '{{name}}님을 로비에서 내보내기',
    close: '로비 닫기',
    confirmClose: '로비를 닫을까요? 모두 메인 메뉴로 돌아갑니다.',
    preparingTitle: '게임 준비 중',
    preparingDescription: '호스트가 역할과 규칙을 고르고 있습니다.',
    validation: {
      roles: '시작하기 전에 역할 설정을 확인하세요.',
    },
    notices: {
      codeCopied: '로비 코드를 복사했습니다.',
      copyFailed: '코드를 복사할 수 없습니다. 직접 선택해 주세요.',
      invitationShared: '초대를 공유했습니다.',
      inviteLinkCopied: '초대 링크를 복사했습니다.',
      shareFailed: '초대를 공유할 수 없습니다.',
      syncFailed: '로비를 동기화할 수 없습니다. 연결을 확인하고 다시 시도하세요.',
    },
    inviteText: '내 로비에 참가하세요. 코드: {{code}}',
  },
} satisfies TranslationShape<typeof enBase>

const arBase = {
  common: {
    appName: 'المستذئب',
  },
  metadata: {
    title: 'المستذئب',
    description: 'لعبة الاستنتاج الجماعية الكلاسيكية، مباشرة في المتصفح.',
  },
  language: {
    label: 'اللغة',
    groupLabel: 'اختر اللغة',
    changeTo: 'اختر {{language}}',
  },
  theme: {
    label: 'المظهر',
    switchToLight: 'التبديل إلى المظهر الفاتح',
    switchToDark: 'التبديل إلى المظهر الداكن',
    dark: 'داكن',
    light: 'فاتح',
  },
  home: {
    guestName: 'لاعب',
    kicker: 'ليلة واحدة. قرية واحدة. أكاذيب كثيرة.',
    title: 'المستذئب',
    subtitle: 'تستيقظ القرية. اعثروا على الذئاب قبل أن تعثر عليكم.',
    panelLabel: 'ابدأ اللعب',
    nameLabel: 'اسمك',
    namePlaceholder: 'اكتب اسمك',
    nameHint: 'هكذا سيراك اللاعبون الآخرون.',
    create: 'إنشاء ردهة',
    creating: 'جارٍ إنشاء الردهة',
    divider: 'أو انضم',
    codeLabel: 'رمز الردهة',
    codeInputLabel: 'رمز ردهة من ستة أحرف',
    join: 'انضم',
    searching: 'جارٍ البحث',
    privacyNote: 'لا تحتاج إلى حساب · العب مباشرة مع مجموعتك',
    errors: {
      kicked: 'تمت إزالتك من الردهة.',
      closed: 'تم إغلاق الردهة.',
      notFound: 'لم نجد ردهة بهذا الرمز.',
      invalidCode: 'أدخل رمز ردهة صالحًا من ستة أحرف.',
    },
  },
  lobby: {
    loading: 'جارٍ تحميل الردهة',
    open: 'الردهة مفتوحة',
    codeLabel: 'رمز الردهة',
    copyCodeLabel: 'انسخ رمز الردهة {{code}}',
    linkCopied: 'تم نسخ الرابط',
    shareInvite: 'مشاركة الدعوة',
    playersTitle: 'اللاعبون',
    you: 'أنت',
    hostLabel: 'المضيف',
    kickPlayerLabel: 'إزالة {{name}} من الردهة',
    close: 'إغلاق الردهة',
    confirmClose: 'هل تريد إغلاق الردهة؟ سيعود الجميع إلى القائمة الرئيسية.',
    preparingTitle: 'جارٍ تجهيز اللعبة',
    preparingDescription: 'يختار المضيف الأدوار والقواعد.',
    validation: {
      roles: 'تحقق من توزيع الأدوار قبل البدء.',
    },
    notices: {
      codeCopied: 'تم نسخ رمز الردهة.',
      copyFailed: 'تعذر نسخ الرمز. حدده يدويًا.',
      invitationShared: 'تمت مشاركة الدعوة.',
      inviteLinkCopied: 'تم نسخ رابط الدعوة.',
      shareFailed: 'تعذرت مشاركة الدعوة.',
      syncFailed: 'تعذرت مزامنة الردهة. تحقق من الاتصال وحاول مرة أخرى.',
    },
    inviteText: 'انضم إلى ردهتي. الرمز: {{code}}',
  },
} satisfies TranslationShape<typeof enBase>

const en = { ...enBase, ...GAME_TRANSLATIONS.en, ...COMPONENT_TRANSLATIONS.en } as const
const de = { ...deBase, ...GAME_TRANSLATIONS.de, ...COMPONENT_TRANSLATIONS.de } satisfies TranslationShape<typeof en>
const es = { ...esBase, ...GAME_TRANSLATIONS.es, ...COMPONENT_TRANSLATIONS.es } satisfies TranslationShape<typeof en>
const fr = { ...frBase, ...GAME_TRANSLATIONS.fr, ...COMPONENT_TRANSLATIONS.fr } satisfies TranslationShape<typeof en>
const it = { ...itBase, ...GAME_TRANSLATIONS.it, ...COMPONENT_TRANSLATIONS.it } satisfies TranslationShape<typeof en>
const pt = { ...ptBase, ...GAME_TRANSLATIONS.pt, ...COMPONENT_TRANSLATIONS.pt } satisfies TranslationShape<typeof en>
const zh = { ...zhBase, ...GAME_TRANSLATIONS.zh, ...COMPONENT_TRANSLATIONS.zh } satisfies TranslationShape<typeof en>
const ja = { ...jaBase, ...GAME_TRANSLATIONS.ja, ...COMPONENT_TRANSLATIONS.ja } satisfies TranslationShape<typeof en>
const ko = { ...koBase, ...GAME_TRANSLATIONS.ko, ...COMPONENT_TRANSLATIONS.ko } satisfies TranslationShape<typeof en>
const ar = { ...arBase, ...GAME_TRANSLATIONS.ar, ...COMPONENT_TRANSLATIONS.ar } satisfies TranslationShape<typeof en>

export const translations = { en, de, es, fr, it, pt, zh, ja, ko, ar } as const

type DotPath<T> = {
  [Key in keyof T & string]: T[Key] extends string
    ? Key
    : T[Key] extends Record<string, unknown>
      ? `${Key}.${DotPath<T[Key]>}`
      : never
}[keyof T & string]

export type TranslationKey = DotPath<typeof en>
export type TranslationParams = Record<string, string | number>
export type Translator = (key: TranslationKey, params?: TranslationParams) => string

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export function parseLocale(value: string | null | undefined): Locale | null {
  if (!value) return null
  const base = value.trim().toLowerCase().split(/[-_]/)[0]
  return isLocale(base) ? base : null
}

export function resolveInitialLocale(storedLocale: string | null | undefined): Locale {
  return parseLocale(storedLocale) ?? DEFAULT_LOCALE
}

export function translate(
  locale: Locale,
  key: TranslationKey,
  params: TranslationParams = {},
): string {
  let value: unknown = translations[locale]
  for (const segment of key.split('.')) {
    if (!value || typeof value !== 'object') return key
    value = (value as Record<string, unknown>)[segment]
  }

  if (typeof value !== 'string') return key
  return value.replace(/\{\{(\w+)\}\}/g, (match, name: string) => (
    Object.hasOwn(params, name) ? String(params[name]) : match
  ))
}
