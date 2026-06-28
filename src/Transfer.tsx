type Mode = "send" | "receive";

type TransferProps = {
  mode: Mode;
  onExit: () => void;
};

export default function Transfer({
  mode,
  onExit,
}: TransferProps) {
  return (
    <div>
      <h2>{mode.toUpperCase()}</h2>

      <button onClick={onExit}>
        Exit
      </button>
    </div>
  );
}
