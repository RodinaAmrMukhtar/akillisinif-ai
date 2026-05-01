import DashboardShell from "@/components/DashboardShell";
import {
  BsChatDots,
  BsLock,
  BsPeople,
  BsSearch,
  BsSend,
} from "react-icons/bs";

const rooms = [
  {
    name: "10-A Matematik Grup Sohbeti",
    type: "Sınıf Grubu",
    lastMessage: "Yarınki quiz için tekrar dosyası paylaşıldı.",
    unread: 4,
    active: true,
  },
  {
    name: "Ayşe Yılmaz",
    type: "Öğrenci Özel Görüşme",
    lastMessage: "Hocam fonksiyonlar konusu için ek kaynak alabilir miyim?",
    unread: 1,
    active: false,
  },
  {
    name: "Mehmet Demir",
    type: "Öğrenci Özel Görüşme",
    lastMessage: "Eksik ödevleri bugün tamamlamaya çalışacağım.",
    unread: 0,
    active: false,
  },
];

const messages = [
  {
    sender: "Ahmet Öğretmen",
    role: "Öğretmen",
    text: "Merhaba arkadaşlar, yarınki quiz için fonksiyonlar konusundan kısa tekrar yapmanızı öneriyorum.",
    time: "09:15",
    own: true,
  },
  {
    sender: "Ayşe Yılmaz",
    role: "Öğrenci",
    text: "Hocam özellikle grafik sorularına çalışmalı mıyız?",
    time: "09:18",
    own: false,
  },
  {
    sender: "Ahmet Öğretmen",
    role: "Öğretmen",
    text: "Evet, grafik yorumlama ve temel fonksiyon tanımı sorularına ağırlık verin.",
    time: "09:20",
    own: true,
  },
];

export default function TeacherChatPage() {
  return (
    <DashboardShell
      title="Mesajlar"
      description="Öğretmenler sınıf grup sohbetlerini ve öğrencilerle özel görüşmeleri bu ekrandan takip eder. Gerçek zamanlı mesajlaşma daha sonra Supabase Realtime ile bağlanacaktır."
      activePage="teacher-chat"
    >
      <div className="grid min-h-[680px] gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Sohbetler
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Sınıf ve özel görüşmeler
                </p>
              </div>

              <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                <BsChatDots />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <BsSearch className="text-slate-400" />
              <input
                type="text"
                placeholder="Sohbet ara"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {rooms.map((room) => (
              <button
                key={room.name}
                type="button"
                className={`w-full p-5 text-left transition ${
                  room.active ? "bg-blue-50" : "bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950">{room.name}</p>
                    <p className="mt-1 text-xs font-medium text-blue-700">
                      {room.type}
                    </p>
                  </div>

                  {room.unread > 0 && (
                    <span className="rounded-full bg-blue-700 px-2.5 py-1 text-xs font-bold text-white">
                      {room.unread}
                    </span>
                  )}
                </div>

                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                  {room.lastMessage}
                </p>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">
                    10-A Matematik Grup Sohbeti
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    28 öğrenci, 1 öğretmen
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  <BsPeople />
                  Sınıf grubu
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-5 bg-slate-50 p-6">
              {messages.map((message) => (
                <div
                  key={`${message.sender}-${message.time}`}
                  className={`flex ${message.own ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xl rounded-3xl border p-4 shadow-sm ${
                      message.own
                        ? "border-blue-200 bg-blue-700 text-white"
                        : "border-slate-200 bg-white text-slate-950"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-6">
                      <p
                        className={`text-sm font-semibold ${
                          message.own ? "text-white" : "text-slate-950"
                        }`}
                      >
                        {message.sender}
                      </p>
                      <p
                        className={`text-xs ${
                          message.own ? "text-blue-100" : "text-slate-400"
                        }`}
                      >
                        {message.time}
                      </p>
                    </div>

                    <p className="text-sm leading-6">{message.text}</p>

                    <p
                      className={`mt-2 text-xs ${
                        message.own ? "text-blue-100" : "text-slate-400"
                      }`}
                    >
                      {message.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 p-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <textarea
                  rows={3}
                  placeholder="Sınıfa mesaj yazın"
                  className="w-full resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400"
                />

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <BsLock />
                    Mesajlar sınıf üyeleriyle sınırlıdır.
                  </div>

                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                  >
                    Gönder
                    <BsSend />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}