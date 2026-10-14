/** Se muestra si la invitación no existe o todavía no está publicada. */
export default function InvitationNotFound() {
  return (
    <main className="grid flex-1 place-items-center bg-[#f6efe6] px-6 py-20 text-center text-[#4a3f37]">
      <div className="grid gap-3">
        <p className="text-3xl text-[#a88e6c]">❦</p>
        <h1 className="font-heading text-3xl">Esta invitación aún no está disponible</h1>
        <p className="font-heading text-xl text-[#7d6e62] italic">This invitation is not available yet</p>
      </div>
    </main>
  );
}
